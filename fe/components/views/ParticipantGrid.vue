<template>
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
          <p v-else-if="participant.isMuted" class="text-slate-300 text-xs font-medium mt-0.5">
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
      </div>      </transition>
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
              class="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center mb-3 mx-auto shadow-lg"
            >
              <span class="text-3xl font-bold text-white">{{ participant.name.substring(0, 2).toUpperCase() }}</span>
            </div>
            <p class="text-white text-base font-medium">{{ participant.name }}</p>
          </div>
        </div>
      </transition>
    </div>
  </transition-group>
</template>

<script setup lang="ts">
import { watch, nextTick } from 'vue'
import type { Participant } from '~/stores/meeting'

const props = defineProps<{
  participants: Participant[]
  gridClass: string
  localStream?: MediaStream | null
  remoteStreams?: Map<string, MediaStream>
}>()

// Watch for local stream changes
watch(
  () => props.localStream,
  (newStream) => {
    console.log('[ParticipantGrid] Local stream watch triggered, stream:', !!newStream)
    nextTick(() => {
      const you = props.participants.find(p => p.isYou)
      console.log('[ParticipantGrid] Found YOU participant:', you?.name, 'ID:', you?.id)
      if (you && newStream) {
        const videoEl = document.getElementById(`video-${you.id}`) as HTMLVideoElement
        console.log('[ParticipantGrid] Video element exists:', !!videoEl, 'ID:', `video-${you.id}`)
        if (videoEl) {
          videoEl.srcObject = newStream
          videoEl.play().catch((e) => console.error(`[Video] Error playing local:`, e))
          console.log('[ParticipantGrid] ✅ Set local stream for:', you.name)
        }
      }
    })
  },
  { immediate: true }
)

// Watch for remote streams changes
watch(
  () => props.remoteStreams,
  (newStreams) => {
    console.log('[ParticipantGrid] Remote streams watch triggered')
    console.log('[ParticipantGrid] Remote streams size:', newStreams?.size || 0)
    console.log('[ParticipantGrid] Remote streams keys:', newStreams ? Array.from(newStreams.keys()) : [])
    console.log('[ParticipantGrid] Participants:', props.participants.map(p => ({ id: p.id, name: p.name, isYou: p.isYou })))
    
    nextTick(() => {
      if (!newStreams) {
        console.log('[ParticipantGrid] No remote streams')
        return
      }
      
      for (const [socketId, stream] of newStreams.entries()) {
        console.log('[ParticipantGrid] Processing stream for socketId:', socketId)
        console.log('[ParticipantGrid] Stream has', stream.getTracks().length, 'tracks:', stream.getTracks().map(t => t.kind))
        
        const videoEl = document.getElementById(`video-${socketId}`) as HTMLVideoElement
        console.log('[ParticipantGrid] Video element exists:', !!videoEl, 'ID:', `video-${socketId}`)
        
        if (videoEl) {
          videoEl.srcObject = stream
          videoEl.play().catch((e) => console.error(`[Video] Error playing remote ${socketId}:`, e))
          console.log('[ParticipantGrid] ✅ Set remote stream for:', socketId)
          
          // Force play after delay like in index-backup.vue
          setTimeout(() => {
            if (videoEl.srcObject) {
              console.log('[ParticipantGrid] Force playing video after 100ms for:', socketId)
              videoEl.play().catch(() => {})
            }
          }, 100)
        } else {
          console.error('[ParticipantGrid] ❌ Video element NOT FOUND for:', socketId)
        }
      }
    })
  },
  { deep: true, immediate: true }
)

// Watch for participants changes to update videos
watch(
  () => props.participants,
  () => {
    console.log('[ParticipantGrid] Participants changed, re-binding streams')
    nextTick(() => {
      // Re-trigger stream updates when participants change
      props.participants.forEach(participant => {
        const videoEl = document.getElementById(`video-${participant.id}`) as HTMLVideoElement
        if (!videoEl) {
          console.log('[ParticipantGrid] No video element for:', participant.name, participant.id)
          return
        }
        
        if (participant.isYou && props.localStream) {
          videoEl.srcObject = props.localStream
          videoEl.play().catch(() => {})
          console.log('[ParticipantGrid] Re-bound local stream for:', participant.name)
        } else if (props.remoteStreams) {
          const remoteStream = props.remoteStreams.get(participant.id)
          if (remoteStream) {
            videoEl.srcObject = remoteStream
            videoEl.play().catch(() => {})
            console.log('[ParticipantGrid] Re-bound remote stream for:', participant.name, participant.id)
          } else {
            console.log('[ParticipantGrid] No remote stream found for:', participant.name, participant.id)
          }
        }
      })
    })
  },
  { deep: true }
)
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
