<template>
  <div
    class="w-full h-full rounded-2xl overflow-hidden bg-slate-900 shadow-lg ring-4 ring-primary ring-offset-2 ring-offset-surface-light dark:ring-offset-background-dark transition-all duration-300 flex items-center justify-center"
  >
    <!-- Screen Share Video -->
    <video
      v-if="screenStream"
      ref="videoRef"
      autoplay
      playsinline
      class="w-full h-full object-contain"
    ></video>
    
    <!-- Placeholder when no stream -->
    <div v-else class="text-center">
      <UIcon
        name="material-symbols:present-to-all"
        class="text-[64px] text-slate-600 mb-4"
      />
      <p class="text-white text-xl font-semibold">
        Screen Sharing Active
      </p>
      <p class="text-slate-400 text-sm mt-2">
        {{ sharerName }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  screenStream?: MediaStream | null
  sharerName: string
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

// Update video stream when it changes using watch
watch(() => props.screenStream, (newStream) => {
  console.log('[ScreenShareViewer] Watch triggered, newStream:', newStream)
  console.log('[ScreenShareViewer] Sharer name:', props.sharerName)
  
  nextTick(() => {
    if (videoRef.value && newStream) {
      console.log('[ScreenShareViewer] Setting srcObject, videoRef exists:', !!videoRef.value)
      console.log('[ScreenShareViewer] Stream tracks:', newStream.getTracks().map(t => `${t.kind}: ${t.id}`))
      
      videoRef.value.srcObject = newStream
      videoRef.value.play().catch((e) => {
        console.error('[ScreenShareViewer] Error playing:', e)
      })
      console.log('[ScreenShareViewer] Set screen stream from:', props.sharerName)
      
      // Force play after delay like in index-backup.vue
      setTimeout(() => {
        if (videoRef.value && videoRef.value.srcObject) {
          videoRef.value.play().catch(() => {})
        }
      }, 100)
    } else {
      console.log('[ScreenShareViewer] No videoRef or no stream')
      console.log('[ScreenShareViewer] videoRef:', !!videoRef.value, 'newStream:', !!newStream)
    }
  })
}, { immediate: true })
</script>
