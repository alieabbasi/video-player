import React, { FC, useEffect, useRef, useState } from "react";
import "./VideoPlayer.css";
import { Icon } from "@iconify/react";
import playFill from "@iconify/icons-bi/play-fill";
import pauseFill from "@iconify/icons-bi/pause-fill";
import miniplayerIcon from "@iconify/icons-akar-icons/miniplayer";
import rectangleLandscape32Regular from "@iconify/icons-fluent/rectangle-landscape-32-regular";
import rectangleLandscape16Regular from "@iconify/icons-fluent/rectangle-landscape-16-regular";
import fullScreenMaximize24Filled from "@iconify/icons-fluent/full-screen-maximize-24-filled";
import fullScreenMinimize24Filled from "@iconify/icons-fluent/full-screen-minimize-24-filled";
import speakerOff24Filled from "@iconify/icons-fluent/speaker-off-24-filled";
import speaker224Filled from "@iconify/icons-fluent/speaker-2-24-filled";
import speaker124Filled from "@iconify/icons-fluent/speaker-1-24-filled";

interface VideoPlayerProps {
  src: string;
}

enum PlayerStates {
  IDLE,
  PAUSED,
  PLAYING,
}

enum PlayerSizeActions {
  REGULAR,
  MINI,
  THEATER,
  FULLSCREEN,
}

enum PlayerVolumeLevel {
  HIGH,
  LOW,
  MUTED,
}

const VideoPlayer: FC<VideoPlayerProps> = ({ src }) => {
  const [playerState, setPlayerState] = useState<PlayerStates>(PlayerStates.IDLE);
  const [playerVolumeLevel, setPlayerVolumeLevel] = useState<PlayerVolumeLevel>(PlayerVolumeLevel.HIGH);
  const [tempVolumeValue, setTempVolumeValue] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentSecond, setCurrentSecond] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLInputElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const thumbnailImgRef = useRef<HTMLImageElement>(null);

  if (videoContainerRef.current?.classList.contains("mini-player") && document.pictureInPictureElement === null) {
    videoContainerRef.current?.classList.remove("mini-player");
  }

  const numberFormatter = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 });
  const timeFormatter = (totalSeconds: number) => {
    const seconds = Math.floor(totalSeconds) % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    if (hours > 0) {
      return `${hours}:${numberFormatter.format(minutes)}:${numberFormatter.format(seconds)}`;
    } else {
      return `${minutes}:${numberFormatter.format(seconds)}`;
    }
  };

  useEffect(() => {
    document.onmouseup = (e) => {
      if (isScrubbing) toggleScrubbing(e as unknown as React.MouseEvent);
    };
    document.onmousemove = (e) => {
      console.log("Is Scrubbing:", isScrubbing);
      
      if (isScrubbing) handleTimelineUpdate(e as unknown as React.MouseEvent);
    };
  }, []);

  const playHandler = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setPlayerState(PlayerStates.PLAYING);
      videoContainerRef.current?.classList.remove("paused");
    } else {
      videoRef.current?.pause();
      setPlayerState(PlayerStates.PAUSED);
      videoContainerRef.current?.classList.add("paused");
    }
  };

  const muteHandler = () => {
    if (!videoRef.current) return;

    if (playerVolumeLevel !== PlayerVolumeLevel.MUTED) {
      setTempVolumeValue(videoRef.current.volume);
      setPlayerVolumeLevel(PlayerVolumeLevel.MUTED);
      volumeSliderRef.current!.value = "0";
    } else {
      volumeChangeHandler(tempVolumeValue);
      volumeSliderRef.current!.value = tempVolumeValue.toString();
    }
  };

  const volumeChangeHandler = (value: number) => {
    videoRef.current!.volume = value;
    if (value === 0) {
      setPlayerVolumeLevel(PlayerVolumeLevel.MUTED);
    } else if (value > 0.5) {
      setPlayerVolumeLevel(PlayerVolumeLevel.HIGH);
    } else {
      setPlayerVolumeLevel(PlayerVolumeLevel.LOW);
    }
  };

  const sizeHandler = (size: PlayerSizeActions) => {
    console.log("Size Action:", PlayerSizeActions[size]);

    switch (size) {
      case PlayerSizeActions.THEATER:
        videoContainerRef.current?.classList.toggle("theater");
        videoContainerRef.current?.classList.remove("fullscreen");
        videoContainerRef.current?.classList.remove("mini-player");
        break;
      case PlayerSizeActions.FULLSCREEN:
        videoContainerRef.current?.classList.toggle("fullscreen");
        videoContainerRef.current?.classList.remove("theater");
        videoContainerRef.current?.classList.remove("mini-player");
        break;
      case PlayerSizeActions.MINI:
        videoContainerRef.current?.classList.toggle("mini-player");
        videoContainerRef.current?.classList.remove("theater");
        videoContainerRef.current?.classList.remove("fullscreen");
        break;
      default:
        videoContainerRef.current?.classList.remove("theater");
        videoContainerRef.current?.classList.remove("fullscreen");
        videoContainerRef.current?.classList.remove("mini-player");
        break;
    }

    if (videoContainerRef.current?.classList.contains("fullscreen") && size === PlayerSizeActions.FULLSCREEN) {
      videoContainerRef.current?.requestFullscreen();
    } else {
      if (document.fullscreenElement !== null) {
        document.exitFullscreen();
      }
    }

    if (videoContainerRef.current?.classList.contains("mini-player") && document.pictureInPictureElement === null) {
      videoRef.current?.requestPictureInPicture();
    } else {
      if (document.pictureInPictureElement !== null) {
        document.exitPictureInPicture();
      }
    }
  };

  const onLoadMetaData = () => {
    if (!videoRef.current) return;
    setTotalSeconds(videoRef.current.duration);
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;

    setCurrentSecond(videoRef.current.currentTime);
    const percent = videoRef.current.currentTime / videoRef.current.duration;
    timelineContainerRef.current?.style.setProperty("--progress-position", `${percent}`);
  };

  const playbackSpeedHandler = () => {
    if (!videoRef.current) return;

    let newPlaybackSpeed = videoRef.current.playbackRate + 0.25;
    if (newPlaybackSpeed > 2) {
      newPlaybackSpeed = 0.5;
    }
    videoRef.current.playbackRate = newPlaybackSpeed;
    setPlaybackSpeed(newPlaybackSpeed);
  };

  const handleTimelineUpdate = (e: React.MouseEvent) => {
    if (!timelineContainerRef.current || !videoRef.current || !previewImgRef.current) return;

    const rect = timelineContainerRef.current.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width;
    const previewImgNumber = Math.max(1, Math.floor((percent * videoRef.current.duration) / 10));
    const previewImgSrc = `assets/previewImgs/preview${previewImgNumber}.jpg`;
    previewImgRef.current.src = previewImgSrc;
    timelineContainerRef.current?.style.setProperty("--preview-progress", `${percent}`);

    if (isScrubbing) {
      e.preventDefault();
      thumbnailImgRef.current!.src = previewImgSrc;
      timelineContainerRef.current.style.setProperty("--progress-position", `${percent}`);
    }
  };

  const toggleScrubbing = (e: React.MouseEvent) => {
    if (!timelineContainerRef.current || !videoRef.current || !previewImgRef.current) return;

    const rect = timelineContainerRef.current.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width;
    const newIsScrubbing = (e.buttons & 1) === 1;
    console.log("Is Scrubbing:", newIsScrubbing);
    
    setIsScrubbing(newIsScrubbing);
    videoContainerRef.current?.classList.toggle("scrubbing", newIsScrubbing);
    if (newIsScrubbing) {
      videoRef.current.pause();
    } else {
      videoRef.current.currentTime = percent * videoRef.current.duration;
      videoRef.current.play();
    }

    handleTimelineUpdate(e);
  };

  return (
    <div className="video-container" ref={videoContainerRef}>
      <img className="thumbnail-img" src="" alt="" ref={thumbnailImgRef} />
      <div className="video-controls">
        <div
          className="timeline-container"
          ref={timelineContainerRef}
          onMouseMove={handleTimelineUpdate}
          onMouseDown={toggleScrubbing}
        >
          <div className="timeline">
            <img src="" alt="" className="preview-img" ref={previewImgRef} />
            <div className="thumb-indicator"></div>
          </div>
        </div>
        <div className="buttons">
          <button className="play-pause-button" onClick={playHandler}>
            {playerState === PlayerStates.PLAYING ? <Icon icon={pauseFill} /> : <Icon icon={playFill} />}
          </button>
          <div className="volume-container">
            <button onClick={muteHandler}>
              {playerVolumeLevel === PlayerVolumeLevel.HIGH && <Icon icon={speaker224Filled} />}
              {playerVolumeLevel === PlayerVolumeLevel.LOW && <Icon icon={speaker124Filled} />}
              {playerVolumeLevel === PlayerVolumeLevel.MUTED && <Icon icon={speakerOff24Filled} />}
            </button>
            <input
              ref={volumeSliderRef}
              type="range"
              min="0"
              max="1"
              step="any"
              onChange={(e) => volumeChangeHandler(+e.target.value)}
            />
          </div>
          <div className="duration-container">
            <div className="current-time">{timeFormatter(currentSecond)}</div> /{" "}
            <div className="total-time">{timeFormatter(totalSeconds)}</div>
          </div>
          <button className="wide-button" onClick={playbackSpeedHandler}>
            {playbackSpeed}x
          </button>
          <button onClick={() => sizeHandler(PlayerSizeActions.MINI)}>
            <Icon icon={miniplayerIcon} />
          </button>
          <button onClick={() => sizeHandler(PlayerSizeActions.THEATER)}>
            {videoContainerRef.current?.classList.contains("theater") ? (
              <Icon icon={rectangleLandscape32Regular} />
            ) : (
              <Icon icon={rectangleLandscape16Regular} />
            )}
          </button>
          <button onClick={() => sizeHandler(PlayerSizeActions.FULLSCREEN)}>
            {videoContainerRef.current?.classList.contains("fullscreen") ? (
              <Icon icon={fullScreenMinimize24Filled} />
            ) : (
              <Icon icon={fullScreenMaximize24Filled} />
            )}
          </button>
        </div>
      </div>
      <video
        className="video"
        src={src}
        ref={videoRef}
        onClick={playHandler}
        muted={playerVolumeLevel === PlayerVolumeLevel.MUTED}
        onLoadedMetadata={onLoadMetaData}
        onTimeUpdate={onTimeUpdate}
      ></video>
    </div>
  );
};

export default VideoPlayer;
