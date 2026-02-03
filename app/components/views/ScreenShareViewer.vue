<template>
  <div
    class="w-full h-full rounded-2xl overflow-hidden bg-slate-900 shadow-lg ring-4 ring-primary ring-offset-2 ring-offset-surface-light dark:ring-offset-background-dark transition-all duration-300 flex items-center justify-center"
  >
    <!-- Screen Share Video - Always render for ref binding -->
    <video
      ref="videoRef"
      data-screen-share="true"
      autoplay
      playsinline
      :class="screenStream ? 'w-full h-full object-contain' : 'hidden'"
    ></video>
    
    <!-- Placeholder when no stream -->
    <div v-if="!screenStream" class="text-center">
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
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps<{
  screenStream?: MediaStream | null
  sharerName: string
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

const setVideoStream = (stream: MediaStream | null) => {
  console.log('[ScreenShareViewer] setVideoStream called, stream:', !!stream)
  console.log('[ScreenShareViewer] videoRef.value exists:', !!videoRef.value)
  
  if (!videoRef.value) {
    console.error('[ScreenShareViewer] ❌ videoRef is null!')
    return
  }
  
  if (!stream) {
    console.log('[ScreenShareViewer] No stream, clearing srcObject')
    videoRef.value.srcObject = null
    return
  }
  
  console.log('[ScreenShareViewer] Stream ID:', stream.id)
  console.log('[ScreenShareViewer] Stream tracks:', stream.getTracks().map(t => ({
    kind: t.kind,
    id: t.id.substring(0, 8),
    enabled: t.enabled,
    readyState: t.readyState
  })))
  
  console.log('[ScreenShareViewer] ✅ Setting srcObject')
  videoRef.value.srcObject = stream
  
  videoRef.value.play().then(() => {
    console.log('[ScreenShareViewer] ✅ Video playing successfully')
  }).catch((e) => {
    console.error('[ScreenShareViewer] ❌ Error playing:', e)
  })
  
  // Force play after delay
  setTimeout(() => {
    if (videoRef.value && videoRef.value.srcObject) {
      console.log('[ScreenShareViewer] 🔁 Force playing after 100ms')
      videoRef.value.play().catch((e) => {
        console.error('[ScreenShareViewer] ❌ Force play error:', e)
      })
    }
  }, 100)
}

// Set initial stream after component is mounted
onMounted(() => {
  console.log('[ScreenShareViewer] ========== MOUNTED ==========')
  console.log('[ScreenShareViewer] videoRef.value exists:', !!videoRef.value)
  console.log('[ScreenShareViewer] Initial stream:', !!props.screenStream)
  
  nextTick(() => {
    if (props.screenStream) {
      console.log('[ScreenShareViewer] Setting initial stream after mount')
      setVideoStream(props.screenStream)
    }
  })
})

// Watch for stream changes
watch(() => props.screenStream, (newStream: any) => {
  console.log('[ScreenShareViewer] ========== WATCH TRIGGERED ==========')
  console.log('[ScreenShareViewer] newStream:', newStream)
  console.log('[ScreenShareViewer] newStream is MediaStream?', newStream instanceof MediaStream)
  console.log('[ScreenShareViewer] Sharer name:', props.sharerName)
  
  nextTick(() => {
    setVideoStream(newStream)
  })
})
</script>
