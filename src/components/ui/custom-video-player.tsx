"use client";

import { cn } from "@/lib/utils";
import {
  FullscreenButton,
  Gesture,
  MediaPlayer,
  MediaProvider,
  MuteButton,
  PlayButton,
  Poster,
  SeekButton,
  Time,
  TimeSlider,
  VolumeSlider,
  useMediaRemote,
  useMediaState,
} from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/sliders.css";
import {
  Check,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  Play,
  RotateCcw as SeekBackward,
  RotateCw as SeekForward,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export interface CustomVideoPlayerProps {
  url?: string | null;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
}

export function CustomVideoPlayer({
  url,
  title,
  poster,
  autoPlay = false,
  className,
  onEnded,
  onTimeUpdate,
}: CustomVideoPlayerProps) {
  const t = useTranslations("common.videoPlayer");

  if (!url) {
    return (
      <div
        className={cn(
          "w-full aspect-video rounded-xl bg-card/60 border border-border/50 flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center",
          className,
        )}
      >
        <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center">
          <Play className="w-5 h-5 text-muted-foreground/60 ml-0.5" />
        </div>
        <p className="text-sm font-medium">{t("noVideo")}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full aspect-video rounded-xl overflow-hidden bg-black/90 shadow-lg border border-border/40 group/player select-none",
        className,
      )}
      dir="ltr"
    >
      <MediaPlayer
        src={url}
        title={title}
        autoPlay={autoPlay}
        playsInline
        onEnded={onEnded}
        onTimeUpdate={(detail) => onTimeUpdate?.(detail.currentTime)}
        className="w-full h-full object-contain relative flex items-center justify-center font-sans text-white ring-0 outline-none"
      >
        <MediaProvider className="w-full h-full">
          {poster && (
            <Poster
              src={poster}
              alt={title || "Video thumbnail"}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </MediaProvider>
        {/* Center Play/Pause Overlay Button (shows on pause / hover) */}
        <CenterPlayOverlay />
        {/* Click to Play/Pause (Desktop Only) */}
        <PlayerGestures />
        {/* Controls Bar Overlay */}
        <PlayerControls />
      </MediaPlayer>
    </div>
  );
}

function PlayerControls() {
  const t = useTranslations("common.videoPlayer");
  const isPaused = useMediaState("paused");
  const isMuted = useMediaState("muted");
  const isFullscreen = useMediaState("fullscreen");
  const controlsVisible = useMediaState("controlsVisible");
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  const visible = controlsVisible || isPaused || speedMenuOpen;

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-linear-to-t from-black/90 via-black/50 to-transparent p-3 pt-8 transition-opacity duration-300",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
    >
      <div className="w-full mb-2">
        <TimeSlider.Root className="group/slider relative flex h-6 w-full cursor-pointer items-center touch-none outline-none">
          <TimeSlider.Track className="relative h-1.5 w-full rounded-full bg-white/20 transition-all group-hover/slider:h-2">
            <TimeSlider.TrackFill className="absolute h-full w-(--slider-fill) rounded-full bg-primary" />
            <TimeSlider.Progress className="absolute h-full w-(--slider-progress) rounded-full bg-white/30" />
          </TimeSlider.Track>
          <TimeSlider.Thumb className="absolute top-1/2 left-(--slider-fill) -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-white/80 shadow transition-transform scale-0 group-hover/slider:scale-100" />
        </TimeSlider.Root>
      </div>
      {/* Bottom Controls Row */}
      <div className="flex items-center justify-between gap-2 text-white/90">
        {/* Left Controls: Play, Seek, Volume, Time */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Play / Pause */}
          <PlayButton
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 transition"
            aria-label={isPaused ? t("play") : t("pause")}
          >
            {isPaused ? (
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            ) : (
              <Pause className="w-4 h-4 fill-white text-white" />
            )}
          </PlayButton>

          {/* Seek Backward 10s */}
          <SeekButton
            seconds={-10}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 transition"
            title={t("seekBackward", { seconds: 10 })}
          >
            <SeekBackward className="w-4 h-4" />
          </SeekButton>

          {/* Seek Forward 10s */}
          <SeekButton
            seconds={10}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 transition"
            title={t("seekForward", { seconds: 10 })}
          >
            <SeekForward className="w-4 h-4" />
          </SeekButton>

          {/* Volume & Mute */}
          <div className="flex items-center group/volume">
            <MuteButton
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 transition"
              aria-label={isMuted ? t("unmute") : t("mute")}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </MuteButton>
            <div className="hidden sm:flex w-0 group-hover/volume:w-16 overflow-hidden transition-all duration-200 items-center">
              <VolumeSlider.Root className="relative flex h-6 w-14 cursor-pointer items-center touch-none outline-none">
                <VolumeSlider.Track className="relative h-1 w-full rounded-full bg-white/20">
                  {/* Add w-[var(--slider-fill)] */}
                  <VolumeSlider.TrackFill className="absolute h-full w-(--slider-fill) rounded-full bg-primary" />
                </VolumeSlider.Track>
                {/* Add left-[var(--slider-fill)] */}
                <VolumeSlider.Thumb className="absolute top-1/2 left-(--slider-fill) -translate-y-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-white shadow" />
              </VolumeSlider.Root>
            </div>
          </div>

          {/* Time Display */}
          <div className="flex items-center text-xs font-mono font-medium tracking-tight text-white/80 gap-1 ml-1">
            <Time type="current" className="text-white" />
            <span>/</span>
            <Time type="duration" />
          </div>
        </div>

        {/* Right Controls: Playback Rate, PIP, Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Speed Menu */}
          <PlaybackSpeedMenu onOpenChange={setSpeedMenuOpen} />
          {/* Picture in Picture */}
          <PipButton />

          {/* Fullscreen */}
          <FullscreenButton
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 transition"
            aria-label={isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </FullscreenButton>
        </div>
      </div>
    </div>
  );
}

function CenterPlayOverlay() {
  const t = useTranslations("common.videoPlayer");
  const isPaused = useMediaState("paused");
  const remote = useMediaRemote();

  if (!isPaused) return null;

  return (
    <button
      type="button"
      onClick={() => remote.play()}
      aria-label={t("playVideo")}
      className="absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-2xl backdrop-blur-sm transition-transform hover:scale-110 hover:bg-primary active:scale-95"
    >
      <Play className="ml-0.5 h-6 w-6 fill-current" />
    </button>
  );
}

function PlaybackSpeedMenu({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const t = useTranslations("common.videoPlayer");
  const playbackRate = useMediaState("playbackRate");
  const remote = useMediaRemote();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const rates = [0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("playbackSpeed")}
        className="flex h-8 px-2 items-center gap-1 rounded-lg text-xs font-medium hover:bg-white/15 active:scale-95 transition"
      >
        <span>{playbackRate}x</span>
        <Settings className="w-3.5 h-3.5 opacity-70" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 mb-2 z-50 min-w-32 rounded-xl bg-card/95 backdrop-blur-md p-1 text-card-foreground shadow-2xl border border-border/60"
        >
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("playbackSpeed")}
          </div>
          {rates.map((rate) => (
            <button
              key={rate}
              type="button"
              role="menuitemradio"
              aria-checked={playbackRate === rate}
              onClick={() => {
                remote.changePlaybackRate(rate);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span>{rate === 1 ? t("normalSpeed") : `${rate}x`}</span>
              {playbackRate === rate && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerGestures() {
  const pointer = useMediaState("pointer");
  const isTouch = pointer === "coarse";

  return (
    <>
      <Gesture
        className="absolute inset-0 z-10 block h-full w-full"
        event="pointerup"
        action={isTouch ? "toggle:controls" : "toggle:paused"}
      />
      {isTouch && (
        <>
          {/* Double-tap left/right edges to seek */}
          <Gesture
            className="absolute left-0 top-0 z-10 h-full w-1/5"
            event="dblpointerup"
            action="seek:-10"
          />
          <Gesture
            className="absolute right-0 top-0 z-10 h-full w-1/5"
            event="dblpointerup"
            action="seek:10"
          />
        </>
      )}
    </>
  );
}

function PipButton() {
  const t = useTranslations("common.videoPlayer");
  const remote = useMediaRemote();
  const canPip = useMediaState("canPictureInPicture");
  const isPip = useMediaState("pictureInPicture");

  if (!canPip) return null;

  return (
    <button
      type="button"
      onClick={(e) =>
        isPip
          ? remote.exitPictureInPicture(e.nativeEvent)
          : remote.enterPictureInPicture(e.nativeEvent)
      }
      title={t("pip")}
      aria-label={t("pip")}
      className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 transition"
    >
      <PictureInPicture className="w-4 h-4" />
    </button>
  );
}
