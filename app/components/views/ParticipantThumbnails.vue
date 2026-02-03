<template>
  <transition-group
    name="thumbnail"
    tag="div"
    class="flex flex-col gap-3 p-4 overflow-y-auto h-full"
  >
    <div
      v-for="participant in participants"
      :key="participant.id"
      class="relative rounded-xl overflow-hidden bg-slate-800 shadow-md aspect-video shrink-0 transition-all duration-300 hover:ring-2 hover:ring-primary hover:scale-105"
      :class="{
        'ring-2 ring-primary': participant.isSpeaking,
      }"
    >
      <!-- Video Element for real video -->
      <video
        :id="`thumb-${participant.id}`"
        :data-participant="participant.isYou ? 'local' : participant.id"
        autoplay
        playsinline
        :muted="participant.isYou"
        v-show="!participant.isVideoOff"
        class="absolute inset-0 w-full h-full object-cover"
      ></video>

      <!-- Video Background (fallback) -->
      <div
        v-if="participant.isVideoOff"
        class="absolute inset-0 bg-cover bg-center"
        :style="{
          backgroundImage: `url('${participant.avatar}')`,
        }"
      ></div>

      <!-- Gradient Scrim -->
      <div
        class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60"
      ></div>

      <!-- Top Right Indicators -->
      <div class="absolute top-2 right-2 flex gap-1">
        <transition
          enter-active-class="transition-all duration-200 delay-75"
          leave-active-class="transition-all duration-200"
          enter-from-class="scale-0 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-0 opacity-0"
        >
          <div
            v-if="participant.isMuted"
            class="w-6 h-6 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center border border-red-400/30"
          >
            <UIcon
              name="material-symbols:mic-off"
              class="text-white text-[14px]"
            />
          </div>
        </transition>
        <transition
          enter-active-class="transition-all duration-200 delay-100"
          leave-active-class="transition-all duration-200"
          enter-from-class="scale-0 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-0 opacity-0"
        >
          <div
            v-if="participant.isVideoOff"
            class="w-6 h-6 rounded-full bg-slate-700/80 backdrop-blur-md flex items-center justify-center border border-slate-600/30"
          >
            <UIcon
              name="material-symbols:videocam-off"
              class="text-white text-[14px]"
            />
          </div>
        </transition>
      </div>

      <!-- Bottom Label -->
      <div class="absolute bottom-2 left-2">
        <p class="text-white text-sm font-semibold drop-shadow-md">
          {{ participant.name }}
        </p>
      </div>

      <!-- Speaking Indicator -->
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
          class="absolute bottom-2 right-2 flex items-end gap-0.5 h-3"
        >
          <div
            class="w-0.5 bg-primary rounded-full h-full animate-[pulse_0.5s_ease-in-out_infinite]"
          ></div>
          <div
            class="w-0.5 bg-primary rounded-full h-3/4 animate-[pulse_0.4s_ease-in-out_infinite]"
          ></div>
          <div
            class="w-0.5 bg-primary rounded-full h-1/2 animate-[pulse_0.6s_ease-in-out_infinite]"
          ></div>
        </div>
      </transition>
      <!-- Video Off Overlay -->
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
              class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center mb-2 mx-auto shadow-lg"
            >
              <span class="text-lg font-bold text-white">{{ 
                (participant.name || 'UN').slice(0, 2).toUpperCase()
              }}</span>
            </div>
            <p class="text-white text-xs font-medium">{{ participant.name }}</p>
          </div>
        </div>
      </transition>
    </div>
  </transition-group>
</template>

<script setup lang="ts">
import { watch, nextTick, computed } from "vue";
import type { Participant } from "~/stores/meeting";

const props = defineProps<{
  participants: Participant[];
  localStream?: MediaStream | null;
  remoteStreams?: Map<string, MediaStream>;
}>();

// Watch for local stream changes
watch(
  () => props.localStream,
  (newStream) => {
    nextTick(() => {
      const you = props.participants.find((p) => p.isYou);
      if (you && newStream) {
        const videoEl = document.getElementById(
          `thumb-${you.id}`,
        ) as HTMLVideoElement;
        if (videoEl) {
          videoEl.srcObject = newStream;
          videoEl.play().catch(() => {});
        }
      }
    });
  },
  { immediate: true },
);

// Watch for remote streams changes with size tracker for better reactivity
const remoteStreamsSize = computed(() => props.remoteStreams?.size ?? 0);

watch(
  [() => props.remoteStreams, remoteStreamsSize],
  ([newStreams]) => {
    nextTick(() => {
      if (!newStreams) return;

      console.log(
        "[ParticipantThumbnails] Remote streams watch triggered, size:",
        newStreams.size,
      );
      console.log(
        "[ParticipantThumbnails] Remote stream IDs:",
        Array.from(newStreams.keys()),
      );

      for (const [socketId, stream] of newStreams.entries()) {
        // CRITICAL: Only set video for participants who have camera ON
        const participant = props.participants.find((p) => p.id === socketId);
        if (!participant) {
          console.log(
            "[ParticipantThumbnails] ⚠️ No participant found for socketId:",
            socketId,
          );
          continue;
        }

        if (participant.isVideoOff) {
          console.log(
            "[ParticipantThumbnails] ⚠️ Skipping",
            participant.name,
            "- camera is OFF (isVideoOff=true)",
          );
          continue;
        }

        const videoEl = document.getElementById(
          `thumb-${socketId}`,
        ) as HTMLVideoElement;
        if (videoEl) {
          console.log(
            "[ParticipantThumbnails] ✅ Setting camera stream for",
            participant.name,
            "stream ID:",
            stream.id.substring(0, 8),
          );
          videoEl.srcObject = stream;
          videoEl.play().catch(() => {});

          setTimeout(() => {
            if (videoEl.srcObject) {
              videoEl.play().catch(() => {});
            }
          }, 100);
        } else {
          console.log(
            "[ParticipantThumbnails] ❌ Video element not found for",
            socketId,
          );
        }
      }
    });
  },
  { immediate: true },
);

// Watch for participants changes
watch(
  () => props.participants,
  () => {
    nextTick(() => {
      console.log(
        "[ParticipantThumbnails] Participants watch triggered, count:",
        props.participants.length,
      );
      
      props.participants.forEach((participant) => {
        const videoEl = document.getElementById(
          `thumb-${participant.id}`,
        ) as HTMLVideoElement;
        if (!videoEl) return;

        if (participant.isYou && props.localStream) {
          console.log(
            "[ParticipantThumbnails] Setting local stream for YOU",
          );
          videoEl.srcObject = props.localStream;
          videoEl.play().catch(() => {});
        } else if (props.remoteStreams) {
          // CRITICAL: Only set camera stream, not screen share
          // remoteStreams should ONLY contain camera streams
          const remoteStream = props.remoteStreams.get(participant.id);
          
          if (remoteStream && !participant.isVideoOff) {
            console.log(
              "[ParticipantThumbnails] ✅ Setting camera stream for",
              participant.name,
              "from participants watch",
            );
            videoEl.srcObject = remoteStream;
            videoEl.play().catch(() => {});
          } else if (participant.isVideoOff) {
            console.log(
              "[ParticipantThumbnails] ⏭️ Skipping",
              participant.name,
              "- camera OFF",
            );
            // Clear srcObject if camera is OFF
            if (videoEl.srcObject) {
              videoEl.srcObject = null;
            }
          }
        }
      });
    });
  },
  { deep: true },
);
</script>

<style scoped>
.thumbnail-enter-active {
  transition: all 0.3s ease-out;
}

.thumbnail-leave-active {
  transition: all 0.3s ease-in;
}

.thumbnail-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}

.thumbnail-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

.thumbnail-move {
  transition: transform 0.3s ease;
}
</style>
