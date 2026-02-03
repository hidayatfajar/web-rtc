<template>
  <div class="relative w-full h-full flex items-center justify-center" @mouseenter="handleGridHover" @mouseleave="handleGridLeave">
    <transition-group
      name="grid"
      tag="div"
      :class="gridClass"
      class="grid gap-4 w-full h-full max-w-6xl transition-all duration-300"
    >
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="relative group rounded-2xl overflow-hidden bg-slate-800 shadow-md transition-all duration-300"
        :class="{
          'ring-4 ring-primary ring-offset-2 ring-offset-surface-light dark:ring-offset-background-dark shadow-lg':
            participant.isSpeaking,
        }"
      >
      <!-- Video Background - Always render for stream binding -->
      <video
        :id="`video-${participant.id}`"
        :data-participant="participant.isYou ? 'local' : participant.id"
        autoplay
        playsinline
        :muted="participant.isYou"
        v-show="!participant.isVideoOff"
        class="absolute inset-0 w-full h-full object-cover"
      ></video>

      <!-- Gradient Scrim -->
      <div
        class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60"
      ></div>

      <!-- Top Right Indicators -->
      <div class="absolute top-4 right-4 flex gap-2">
        <transition
          mode="out-in"
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-200"
          enter-from-class="scale-0 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-0 opacity-0"
        >
          <div
            v-if="!participant.isMuted"
            class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10"
          >
            <UIcon name="material-symbols:mic" class="text-white text-[18px]" />
          </div>
          <div
            v-else
            class="w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center border border-red-400/30"
          >
            <UIcon
              name="material-symbols:mic-off"
              class="text-white text-[18px]"
            />
          </div>
        </transition>
      </div>

      <!-- Bottom Left Label -->
      <div class="absolute bottom-4 left-4">
        <p class="text-white text-base font-semibold drop-shadow-md">
          {{ participant.name }}
        </p>
        <transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-200"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <p
            v-if="participant.isSpeaking"
            class="text-primary text-xs font-medium flex items-center gap-1 mt-0.5"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Active Speaker
          </p>
          <p
            v-else-if="participant.isMuted"
            class="text-slate-300 text-xs font-medium mt-0.5"
          >
            Muted
          </p>
        </transition>
      </div>

      <!-- Audio Visualizer (Only for speaking) -->
      <transition
        enter-active-class="transition-all duration-300"
        leave-active-class="transition-all duration-300"
        enter-from-class="opacity-0 scale-0"
        enter-to-class="opacity-100 scale-100"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-0"
      >
        <div
          v-if="participant.isSpeaking"
          class="absolute bottom-4 right-4 flex items-end gap-1 h-4"
        >
          <div
            class="w-1 bg-primary rounded-full h-full animate-[pulse_0.5s_ease-in-out_infinite]"
          ></div>
          <div
            class="w-1 bg-primary rounded-full h-3/4 animate-[pulse_0.4s_ease-in-out_infinite]"
          ></div>
          <div
            class="w-1 bg-primary rounded-full h-1/2 animate-[pulse_0.6s_ease-in-out_infinite]"
          ></div>
        </div>
      </transition>
      <!-- Video Off Overlay - Show only when video is off -->
      <transition
        enter-active-class="transition-all duration-300"
        leave-active-class="transition-all duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="participant.isVideoOff"
          class="absolute inset-0 bg-slate-900 flex items-center justify-center z-10"
        >
          <div class="text-center">
            <div
              class="w-20 h-20 rounded-full bg-linear-to-br from-primary to-blue-700 flex items-center justify-center mb-3 mx-auto shadow-lg"
            >
              <span class="text-3xl font-bold text-white">{{
                (participant.name || "UN").slice(0, 2).toUpperCase()
              }}</span>
            </div>
            <p class="text-white text-base font-medium">
              {{ participant.name }}
            </p>
          </div>
        </div>
      </transition>
    </div>
  </transition-group>
  
  <!-- Floating Control Bar -->
  <transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showControls"
      class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
    >
      <slot name="controls" />
    </div>
  </transition>
</div>
</template>

<script setup lang="ts">
import { watch, nextTick, computed, ref } from "vue";
import type { Participant } from "~/stores/meeting";

const props = defineProps<{
  participants: Participant[];
  gridClass: string;
  localStream?: MediaStream | null;
  remoteStreams?: Map<string, MediaStream>;
}>();

// Hover state for floating controls
const showControls = ref(false);
let hoverTimeout: NodeJS.Timeout | null = null;

const handleGridHover = () => {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  showControls.value = true;
};

const handleGridLeave = () => {
  // Delay hiding controls slightly
  hoverTimeout = setTimeout(() => {
    showControls.value = false;
  }, 300);
};

// Use a computed to track Map size for better reactivity
const remoteStreamsSize = computed(() => props.remoteStreams?.size ?? 0);

// Watch for local stream changes
watch(
  () => props.localStream,
  (newStream) => {
    console.log(
      "[ParticipantGrid] Local stream watch triggered, stream:",
      !!newStream,
    );
    nextTick(() => {
      console.log(
        "[ParticipantGrid] Data Participants:",
        props.participants.map((p) => ({
          id: p.id,
          name: p.name,
          isYou: p.isYou,
        })),
      );
      const you = props.participants.find((p) => p.isYou);
      console.log(
        "[ParticipantGrid] Found YOU participant:",
        you?.name,
        "ID:",
        you?.id,
      );
      if (you && newStream) {
        const videoEl = document.getElementById(
          `video-${you.id}`,
        ) as HTMLVideoElement;
        console.log(
          "[ParticipantGrid] Video element exists:",
          !!videoEl,
          "ID:",
          `video-${you.id}`,
        );
        if (videoEl) {
          videoEl.srcObject = newStream;
          videoEl
            .play()
            .catch((e) => console.error(`[Video] Error playing local:`, e));
          console.log("[ParticipantGrid] ✅ Set local stream for:", you.name);
        }
      }
    });
  },
  { immediate: true },
);

// Watch for remote streams changes AND participants changes together
// This ensures video elements exist before we try to bind streams
watch(
  [() => props.remoteStreams, remoteStreamsSize, () => props.participants],
  ([newStreams, size, participants]) => {
    console.log("[ParticipantGrid] 🔔 Remote streams watch triggered");
    console.log("[ParticipantGrid] Timestamp:", new Date().toISOString());
    console.log(
      "[ParticipantGrid] Remote streams size:",
      newStreams?.size || 0,
    );
    console.log(
      "[ParticipantGrid] Remote streams keys:",
      newStreams
        ? Array.from(newStreams.keys()).map((k) => k.substring(0, 8))
        : [],
    );
    console.log(
      "[ParticipantGrid] Participants count:",
      participants?.length || 0,
    );
    console.log(
      "[ParticipantGrid] Participants:",
      participants?.map((p) => ({
        id: p.id.substring(0, 8),
        name: p.name,
        isYou: p.isYou,
        isVideoOff: p.isVideoOff,
      })) || [],
    );

    // CRITICAL: Wait for DOM to render participants first
    nextTick(() => {
      console.log(
        "[ParticipantGrid] 🔄 After first nextTick, waiting 50ms for DOM...",
      );
      // Wait additional tick to ensure video elements are mounted
      setTimeout(() => {
        console.log(
          "[ParticipantGrid] ⏰ 50ms delay complete, starting stream binding...",
        );

        if (!newStreams || newStreams.size === 0) {
          console.log("[ParticipantGrid] ❌ No remote streams to bind");
          return;
        }

        // Log all available video elements
        const allVideoElements = Array.from(document.querySelectorAll("video"));
        console.log(
          "[ParticipantGrid] 📺 Available video elements:",
          allVideoElements.map((v) => ({ id: v.id, hasStream: !!v.srcObject })),
        );

        console.log(
          "[ParticipantGrid] 🔄 Starting to bind",
          newStreams.size,
          "remote streams...",
        );

        for (const [socketId, stream] of newStreams.entries()) {
          console.log("[ParticipantGrid] ====== Processing stream ======");
          console.log("[ParticipantGrid] Socket ID:", socketId.substring(0, 8));
          console.log(
            "[ParticipantGrid] Stream ID:",
            stream.id.substring(0, 8),
          );
          console.log(
            "[ParticipantGrid] Stream has",
            stream.getTracks().length,
            "tracks:",
            stream.getTracks().map((t) => `${t.kind}:${t.id.substring(0, 8)}`),
          );

          const videoEl = document.getElementById(
            `video-${socketId}`,
          ) as HTMLVideoElement;
          console.log(
            "[ParticipantGrid] Looking for video element ID:",
            `video-${socketId}`,
          );
          console.log("[ParticipantGrid] Video element found:", !!videoEl);

          if (videoEl) {
            // 🔍 Check visibility
            const isVisible = videoEl.offsetParent !== null;
            const display = window.getComputedStyle(videoEl).display;
            console.log(
              "[ParticipantGrid] 👁️ Video element visible:",
              isVisible,
              "display:",
              display,
            );

            // ⚡ CRITICAL: Only set srcObject if it's different to prevent rebinding
            const currentStream = videoEl.srcObject as MediaStream | null;
            if (!currentStream || currentStream.id !== stream.id) {
              console.log(
                "[ParticipantGrid] ✅ Setting srcObject for:",
                socketId.substring(0, 8),
              );
              videoEl.srcObject = stream;
              videoEl
                .play()
                .catch((e) => {
                  console.error(
                    `[Video] ❌ Error playing remote ${socketId.substring(0, 8)}:`,
                    e,
                  );
                })
                .then(() => {
                  console.log(
                    "[ParticipantGrid] ✅ Video playing for:",
                    socketId.substring(0, 8),
                  );
                });

              // Force play after delay
              setTimeout(() => {
                if (videoEl.srcObject) {
                  console.log(
                    "[ParticipantGrid] 🔁 Force playing video after 100ms for:",
                    socketId.substring(0, 8),
                  );
                  videoEl.play().catch(() => {});
                }
              }, 100);
            } else {
              console.log(
                "[ParticipantGrid] ⏭️ Stream already bound for:",
                socketId.substring(0, 8),
              );
            }
          } else {
            console.error(
              "[ParticipantGrid] ❌ Video element NOT FOUND for:",
              socketId.substring(0, 8),
            );
            console.error(
              "[ParticipantGrid] Expected ID:",
              `video-${socketId}`,
            );
            console.error(
              "[ParticipantGrid] Available IDs:",
              allVideoElements.map((v) => v.id),
            );
          }
        }

        console.log("[ParticipantGrid] 🏁 Finished binding all remote streams");
      }, 50); // 50ms delay to ensure DOM is ready
    });
  },
  { immediate: true, deep: true },
);

// Watch for participants changes to update videos (BACKUP mechanism)
// This will retry binding if the first attempt failed
watch(
  () => props.participants,
  () => {
    console.log(
      "[ParticipantGrid] 🔄 Participants changed, re-binding streams (BACKUP)",
    );

    // Use longer delay to ensure everything is rendered
    setTimeout(() => {
      props.participants.forEach((participant) => {
        const videoEl = document.getElementById(
          `video-${participant.id}`,
        ) as HTMLVideoElement;
        if (!videoEl) {
          console.log(
            "[ParticipantGrid] No video element for:",
            participant.name,
            participant.id.substring(0, 8),
          );
          return;
        }

        // Check if video element already has stream
        if (videoEl.srcObject) {
          console.log(
            "[ParticipantGrid] ✅ Video element already has stream:",
            participant.name,
          );
          return;
        }

        if (participant.isYou && props.localStream) {
          console.log(
            "[ParticipantGrid] 🔁 Re-binding local stream for:",
            participant.name,
          );
          videoEl.srcObject = props.localStream;
          videoEl.play().catch(() => {});
        } else if (props.remoteStreams) {
          const remoteStream = props.remoteStreams.get(participant.id);
          if (remoteStream) {
            console.log(
              "[ParticipantGrid] 🔁 Re-binding remote stream for:",
              participant.name,
              participant.id.substring(0, 8),
            );
            videoEl.srcObject = remoteStream;
            videoEl.play().catch(() => {});
          } else {
            console.log(
              "[ParticipantGrid] ⚠️ No remote stream found for:",
              participant.name,
              participant.id.substring(0, 8),
            );
          }
        }
      });
    }, 200); // Longer delay for backup mechanism
  },
  { deep: true },
);
</script>

<style scoped>
.grid-enter-active,
.grid-leave-active {
  transition: all 0.3s ease;
}

.grid-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.grid-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.grid-move {
  transition: transform 0.3s ease;
}
</style>
