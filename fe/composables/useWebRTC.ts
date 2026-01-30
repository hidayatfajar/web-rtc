import { ref, onMounted, onUnmounted, triggerRef, shallowRef } from "vue";
import { io, Socket } from "socket.io-client";
import { useMeetingStore } from "~/stores/meeting";

interface Participant {
  socketId: string;
  username: string;
  isHost?: boolean;
  isCoHost?: boolean;
}

export const useWebRTC = (
  roomId: string,
  username: string,
  onToast?: (
    type: "success" | "error" | "info" | "warn",
    title: string,
    description?: string,
  ) => void,
) => {
  const store = useMeetingStore();

  // Socket & Connection
  let socket: Socket | null = null;
  const isConnected = ref(false);

  // WebRTC Peers
  const peerConnections = new Map<string, RTCPeerConnection>();

  // Media Streams
  const localStream = shallowRef<MediaStream | null>(null);
  const remoteStreams = shallowRef<Map<string, MediaStream>>(new Map());
  const screenShareStreams = shallowRef<Map<string, MediaStream>>(new Map());
  let localScreenStream: MediaStream | null = null;

  // Track who is sharing
  let whoIsSharing = ref<string | null>(null);

  // Stream type mapping: streamId → 'camera' | 'screen'
  const streamTypeMap = new Map<string, "camera" | "screen">();

  // Participants & Roles
  const participants = ref<Participant[]>([]);
  const hostSocketId = ref<string | null>(null);
  const coHostSocketIds = ref<string[]>([]);

  // Config
  const config = useRuntimeConfig();
  const SOCKET_URL = config.public.socketUrl || "http://localhost:3001";

  const iceServers: RTCConfiguration = {
    iceServers: [
      // STUN (optional, buat dapat srflx)
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },

      // TURN UDP (utama buat relay)
      {
        urls: "turn:turn.rekrutmen-traspac.web.id:3478?transport=udp",
        username: "webrtcuser",
        credential: "strongpassword123",
      },

      // TURN TCP fallback (kalau UDP diblok)
      {
        urls: "turn:turn.rekrutmen-traspac.web.id:3478?transport=tcp",
        username: "webrtcuser",
        credential: "strongpassword123",
      },
    ],
  };

  /**
   * Initialize local media stream (camera + mic)
   */
  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Disable tracks by default
      stream.getAudioTracks().forEach((track) => (track.enabled = false));
      stream.getVideoTracks().forEach((track) => (track.enabled = false));

      localStream.value = stream;
      console.log(
        "[WebRTC] Local stream initialized (media OFF by default):",
        stream.id,
      );
      return stream;
    } catch (error) {
      console.error("[WebRTC] Failed to get local stream:", error);
      throw error;
    }
  };

  /**
   * Create peer connection for a remote user
   */
  const createPeerConnection = (remoteSocketId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(iceServers);
    if (peerConnections.has(remoteSocketId)) {
      console.warn(
        "[WebRTC] PeerConnection already exists for:",
        remoteSocketId,
      );
      return peerConnections.get(remoteSocketId)!;
    }

    // DISABLED: negotiationneeded to avoid race conditions
    // We handle all renegotiation manually like in index-backup.vue
    // This prevents "Called in wrong state" errors
    pc.onnegotiationneeded = async () => {
      console.log(
        "🔥 negotiationneeded fired for",
        remoteSocketId,
        "(ignored)",
      );
      // Do nothing - we handle renegotiation manually
    };

    // Add local camera tracks if available
    // CRITICAL FIX: Add ALL tracks from localStream, not just enabled ones
    // This ensures that when user has camera ON and new peer joins,
    // the tracks are already in the PeerConnection and will be sent in the offer
    console.log(
      "[WebRTC] Creating PC for",
      remoteSocketId,
      "- checking local media...",
    );
    console.log("[WebRTC] localStream exists:", !!localStream.value);
    console.log(
      "[WebRTC] localScreenStream exists:",
      !!localScreenStream,
      "isScreenSharing:",
      store.isScreenSharing,
    );

    if (localStream.value) {
      const rawStream = toRaw(localStream.value);
      console.log(
        "[WebRTC] Adding camera tracks, count:",
        rawStream.getTracks().length,
      );

      rawStream.getTracks().forEach((track) => {
        // Add ALL tracks, regardless of enabled state
        // WebRTC will handle disabled tracks properly
        pc.addTrack(track, rawStream);
        console.log(
          "[WebRTC] ✅ Added",
          track.kind,
          "track to PC for",
          remoteSocketId,
          "enabled:",
          track.enabled,
          "id:",
          track.id.substring(0, 8),
        );
      });
    } else {
      console.log("[WebRTC] ⚠️ No localStream to add");
    }

    // Add screen share tracks if currently sharing
    if (localScreenStream && store.isScreenSharing) {
      console.log(
        "[WebRTC] 🎥 Adding screen share tracks to PC for",
        remoteSocketId,
      );
      console.log(
        "[WebRTC] Screen stream ID:",
        localScreenStream.id.substring(0, 8),
      );
      localScreenStream.getTracks().forEach((track) => {
        pc.addTrack(track, localScreenStream!);
        console.log(
          "[WebRTC] ✅ Added screen",
          track.kind,
          "track, id:",
          track.id.substring(0, 8),
        );
      });
    } else {
      console.log(
        "[WebRTC] No screen share to add (localScreenStream:",
        !!localScreenStream,
        "isScreenSharing:",
        store.isScreenSharing,
        ")",
      );
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc-ice-candidate", {
          roomId,
          candidate: event.candidate,
          targetId: remoteSocketId,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      const streamId = stream.id;
      const rawRemoteStream = markRaw(stream);

      console.log("[WebRTC] ========== ONTRACK EVENT ==========");
      console.log("[WebRTC] From:", remoteSocketId);
      console.log("[WebRTC] Stream ID:", streamId);
      console.log("[WebRTC] Track kind:", event.track.kind);
      console.log(
        "[WebRTC] Stream has",
        stream.getVideoTracks().length,
        "video,",
        stream.getAudioTracks().length,
        "audio tracks",
      );

      // 🎯 Check stream type from mapping (set by socket events)
      const streamType = streamTypeMap.get(streamId);
      console.log("[WebRTC] 🔍 Stream type from mapping:", streamType);
      console.log("[WebRTC] whoIsSharing.value:", whoIsSharing.value);
      console.log(
        "[WebRTC] Is this peer sharing?",
        whoIsSharing.value === remoteSocketId,
      );

      // 🔧 Listen for track ended (when remote user turns off video)
      event.track.onended = () => {
        console.log(
          `[WebRTC] 📴 Track ended for ${remoteSocketId}, kind: ${event.track.kind}`,
        );
        if (event.track.kind === "video") {
          // Check if stream has any active video tracks
          const hasActiveVideo = stream
            .getVideoTracks()
            .some((t) => t.readyState === "live");
          if (!hasActiveVideo) {
            console.log(
              `[WebRTC] ❌ No active video tracks, setting isVideoOff = true`,
            );
            store.updateParticipantVideoStatus(remoteSocketId, true);
          }
        }
      };

      const existingCameraStream = remoteStreams.value.get(remoteSocketId);
      const existingScreenStream = screenShareStreams.value.get(remoteSocketId);

      console.log(
        "[WebRTC] Existing camera stream:",
        existingCameraStream ? existingCameraStream.id : "none",
      );
      console.log(
        "[WebRTC] Existing screen stream:",
        existingScreenStream ? existingScreenStream.id : "none",
      );

      // 🎯 PRIMARY: Use streamType from socket signal (most reliable)
      // FALLBACK: Use existing logic if signal not received yet

      if (streamType === "screen") {
        // Explicitly marked as screen share by socket signal
        console.log("[WebRTC] 🖥️ SCREEN SHARE (from socket signal)");

        const newScreenMap = new Map(screenShareStreams.value);
        newScreenMap.set(remoteSocketId, rawRemoteStream);
        screenShareStreams.value = newScreenMap;
        console.log("[WebRTC] ⚡ Added to screenShareStreams");
        console.log(
          "[WebRTC] 📊 screenShareStreams now has",
          screenShareStreams.value.size,
          "streams",
        );
      } else if (streamType === "camera") {
        // Explicitly marked as camera by socket signal
        console.log("[WebRTC] 📹 CAMERA (from socket signal)");

        const newMap = new Map(remoteStreams.value);
        newMap.set(remoteSocketId, rawRemoteStream);
        remoteStreams.value = newMap;
        console.log("[WebRTC] ⚡ Added to remoteStreams");
        console.log(
          "[WebRTC] 🔥 NEW Map instance created, size:",
          remoteStreams.value.size,
        );

        // Update participant video status to ON
        store.updateParticipantVideoStatus(remoteSocketId, false);
        console.log("[WebRTC] ✅ Updated participant video status to ON");
      } else if (whoIsSharing.value === remoteSocketId) {
        // This peer is sharing screen
        console.log("[WebRTC] 🎥 Peer is currently sharing screen");

        // Case 1: Already have camera, new different stream = screen share
        if (existingCameraStream && existingCameraStream.id !== streamId) {
          console.log(
            "[WebRTC] ✅ SCREEN SHARE detected (have camera, different stream ID)",
          );
          console.log(
            "[WebRTC] Camera stream ID:",
            existingCameraStream.id.substring(0, 8),
          );
          console.log("[WebRTC] Screen stream ID:", streamId.substring(0, 8));

          const newScreenMap = new Map(screenShareStreams.value);
          newScreenMap.set(remoteSocketId, rawRemoteStream);
          screenShareStreams.value = newScreenMap;
          console.log("[WebRTC] ⚡ Screen share added to screenShareStreams");
          console.log(
            "[WebRTC] 📊 screenShareStreams now has",
            screenShareStreams.value.size,
            "streams",
          );
        }
        // Case 2: Already have screen, new different stream = camera
        else if (existingScreenStream && existingScreenStream.id !== streamId) {
          console.log(
            "[WebRTC] 📹 CAMERA detected (have screen, different stream ID)",
          );
          console.log(
            "[WebRTC] Screen stream ID:",
            existingScreenStream.id.substring(0, 8),
          );
          console.log("[WebRTC] Camera stream ID:", streamId.substring(0, 8));

          const newMap = new Map(remoteStreams.value);
          newMap.set(remoteSocketId, rawRemoteStream);
          remoteStreams.value = newMap;
          console.log("[WebRTC] ⚡ Camera added to remoteStreams");
          console.log(
            "[WebRTC] 🔥 NEW Map instance created, size:",
            remoteStreams.value.size,
          );

          // Update participant video status to ON
          store.updateParticipantVideoStatus(remoteSocketId, false);
          console.log("[WebRTC] ✅ Updated participant video status to ON");
        }
        // Case 3: First stream, no existing streams - check participant status
        else if (!existingCameraStream && !existingScreenStream) {
          const participant = store.participants.find(
            (p) => p.id === remoteSocketId,
          );
          const isVideoOff = participant?.isVideoOff ?? true;

          console.log("[WebRTC] 🎯 First stream from sharing peer");
          console.log("[WebRTC] Stream ID:", streamId.substring(0, 8));
          console.log("[WebRTC] Participant isVideoOff:", isVideoOff);

          if (isVideoOff) {
            // Camera OFF -> this is screen share only
            console.log("[WebRTC] 🖥️ Camera is OFF, treating as SCREEN SHARE");

            const newScreenMap = new Map(screenShareStreams.value);
            newScreenMap.set(remoteSocketId, rawRemoteStream);
            screenShareStreams.value = newScreenMap;
            console.log("[WebRTC] ⚡ Added to screenShareStreams");
            console.log(
              "[WebRTC] 🔥 NEW Map instance created, size:",
              screenShareStreams.value.size,
            );
          } else {
            // Camera ON -> this is camera (screen will come as 2nd stream)
            console.log("[WebRTC] 📹 Camera is ON, treating as CAMERA stream");

            const newMap = new Map(remoteStreams.value);
            newMap.set(remoteSocketId, rawRemoteStream);
            remoteStreams.value = newMap;
            console.log("[WebRTC] ⚡ Added to remoteStreams (camera)");
            console.log(
              "[WebRTC] 🔥 NEW Map instance created, size:",
              remoteStreams.value.size,
            );

            // Keep participant video status as ON (already ON)
            console.log("[WebRTC] ✅ Participant video status already ON");
          }
        }
        // Case 4: Same stream ID as existing camera - track update
        else if (existingCameraStream && existingCameraStream.id === streamId) {
          console.log(
            "[WebRTC] 🔄 Same stream ID as camera, updating camera stream",
          );
          const newMap = new Map(remoteStreams.value);
          newMap.set(remoteSocketId, rawRemoteStream);
          remoteStreams.value = newMap;
          console.log(
            "[WebRTC] 🔥 NEW Map instance created, size:",
            remoteStreams.value.size,
          );

          // Update participant video status to ON
          store.updateParticipantVideoStatus(remoteSocketId, false);
          console.log("[WebRTC] ✅ Updated participant video status to ON");
        }
        // Case 5: Same stream ID as existing screen - track update
        else if (existingScreenStream && existingScreenStream.id === streamId) {
          console.log(
            "[WebRTC] 🔄 Same stream ID as screen, updating screen stream",
          );
          const newScreenMap = new Map(screenShareStreams.value);
          newScreenMap.set(remoteSocketId, rawRemoteStream);
          screenShareStreams.value = newScreenMap;
          console.log(
            "[WebRTC] 🔥 NEW Map instance created, size:",
            screenShareStreams.value.size,
          );
        }
        // Case 6: Unexpected - log warning
        else {
          console.warn(
            "[WebRTC] ⚠️ Unexpected stream scenario:",
            "existingCamera:",
            !!existingCameraStream,
            "existingScreen:",
            !!existingScreenStream,
            "streamId:",
            streamId.substring(0, 8),
          );
        }
      } else {
        // Not sharing - this is camera stream
        console.log("[WebRTC] 📹 Camera stream (peer not sharing)");
        // Create NEW Map instance for reactivity - CRITICAL FIX!
        const newMap = new Map(remoteStreams.value);
        newMap.set(remoteSocketId, rawRemoteStream);
        remoteStreams.value = newMap;
        console.log("[WebRTC] ⚡ Added to remoteStreams");
        console.log(
          "[WebRTC] 🔥 NEW Map instance created, size:",
          remoteStreams.value.size,
        );

        // 🎯 CRITICAL: Update participant isVideoOff to false
        store.updateParticipantVideoStatus(remoteSocketId, false);
        console.log(
          "[WebRTC] ✅ Updated participant video status to ON for:",
          remoteSocketId.substring(0, 8),
        );
      }

      console.log(
        "[WebRTC] 📊 FINAL STATE - screenShareStreams:",
        screenShareStreams.value.size,
        "remoteStreams:",
        remoteStreams.value.size,
      );
      console.log("[WebRTC] ====================================\n");
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(
        `[WebRTC] Connection state for ${remoteSocketId}:`,
        pc.connectionState,
      );
    };

    peerConnections.set(remoteSocketId, pc);
    return pc;
  };
  /**
   * Create and send offer to remote peer
   */
  const createOffer = async (remoteSocketId: string) => {
    try {
      const pc = createPeerConnection(remoteSocketId);

      // Guard: Only create offer if in stable state
      if (pc.signalingState !== "stable") {
        console.log(
          "[WebRTC] Skipping createOffer, PC not stable:",
          pc.signalingState,
          "for",
          remoteSocketId,
        );
        return;
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit("webrtc-offer", {
        roomId,
        offer,
        targetId: remoteSocketId,
      });

      console.log("[WebRTC] Offer sent to:", remoteSocketId);
    } catch (error) {
      console.error("[WebRTC] Error creating offer:", error);
    }
  };

  /**
   * Handle incoming offer from remote peer
   */
  const handleOffer = async (
    remoteSocketId: string,
    offer: RTCSessionDescriptionInit,
  ) => {
    try {
      const pc = createPeerConnection(remoteSocketId);

      // Check signaling state before processing offer
      console.log("[WebRTC] handleOffer - current state:", pc.signalingState);

      // If we're in the middle of creating an offer, wait or rollback
      if (
        pc.signalingState !== "stable" &&
        pc.signalingState !== "have-remote-offer"
      ) {
        console.log(
          "[WebRTC] Waiting for stable state before handling offer...",
        );
        // Simple approach: wait a bit and retry once
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit("webrtc-answer", {
        roomId,
        answer,
        targetId: remoteSocketId,
      });

      console.log("[WebRTC] Answer sent to:", remoteSocketId);
    } catch (error) {
      console.error("[WebRTC] Error handling offer:", error);
    }
  };

  /**
   * Handle incoming answer from remote peer
   */
  const handleAnswer = async (
    remoteSocketId: string,
    answer: RTCSessionDescriptionInit,
  ) => {
    try {
      const pc = peerConnections.get(remoteSocketId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("[WebRTC] Answer received from:", remoteSocketId);
      }
    } catch (error) {
      console.error("[WebRTC] Error handling answer:", error);
    }
  };

  /**
   * Handle ICE candidate from remote peer
   */
  const handleIceCandidate = async (
    remoteSocketId: string,
    candidate: RTCIceCandidateInit,
  ) => {
    try {
      const pc = peerConnections.get(remoteSocketId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("[WebRTC] ICE candidate added for:", remoteSocketId);
      }
    } catch (error) {
      console.error("[WebRTC] Error adding ICE candidate:", error);
    }
  };

  /**
   * Close peer connection
   */
  const closePeerConnection = (remoteSocketId: string) => {
    const pc = peerConnections.get(remoteSocketId);
    if (pc) {
      pc.close();
      peerConnections.delete(remoteSocketId);

      // Create NEW Map instances for reactivity
      const newRemoteMap = new Map(remoteStreams.value);
      newRemoteMap.delete(remoteSocketId);
      remoteStreams.value = newRemoteMap;

      console.log("[WebRTC] Peer connection closed:", remoteSocketId);
    }
  };

  /**
   * Connect to socket server and setup event handlers
   */
  const connectSocket = async () => {
    console.log("[Socket] Attempting to connect to:", SOCKET_URL);

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket?.id);
      isConnected.value = true;

      // Join room with username
      console.log("[Socket] Emitting join-room:", { roomId, username });
      socket?.emit("join-room", { roomId, username });
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      isConnected.value = false;
    });

    socket.on(
      "joined-room",
      async ({
        socketId,
        participants: participantsList,
        whoIsSharing: initialSharing,
        isRecording,
        host,
        coHosts,
        streamTypes,
      }) => {
        console.log("[Socket] Joined room:", roomId, "as", socketId);
        console.log("[Socket] Participants received:", participantsList);
        console.log("[Socket] Host:", host);
        console.log("[Socket] Co-hosts:", coHosts);
        console.log("[Socket] 🎥 Initial whoIsSharing:", initialSharing);
        console.log("[Socket] 🎯 Stream types received:", streamTypes);

        // Initialize stream type mapping for late joiners
        if (streamTypes) {
          Object.entries(streamTypes).forEach(
            ([participantSocketId, streams]: [string, any]) => {
              if (streams.cameraStreamId) {
                streamTypeMap.set(streams.cameraStreamId, "camera");
                console.log(
                  "[Socket] ✅ Mapped",
                  streams.cameraStreamId.substring(0, 8),
                  "→ camera (from",
                  participantSocketId.substring(0, 8),
                  ")",
                );
              }
              if (streams.screenStreamId) {
                streamTypeMap.set(streams.screenStreamId, "screen");
                console.log(
                  "[Socket] ✅ Mapped",
                  streams.screenStreamId.substring(0, 8),
                  "→ screen (from",
                  participantSocketId.substring(0, 8),
                  ")",
                );
              }
            },
          );
        }

        // Initialize store with metadata
        store.initMeeting(roomId, username, socketId);

        // Update participants (includes yourself)
        if (participantsList && participantsList.length > 0) {
          participants.value = participantsList;
          hostSocketId.value = host;
          coHostSocketIds.value = coHosts || [];
          store.updateParticipants(participantsList);
        } else {
          console.error("[Socket] No participants in joined-room response!");
        }

        // CRITICAL: Set initial sharing state BEFORE any peer connections are made
        // This ensures whoIsSharing is set when ontrack fires
        if (initialSharing && initialSharing !== socketId) {
          console.log(
            "[Socket] ✅ Someone is already sharing:",
            initialSharing,
          );
          whoIsSharing.value = initialSharing;
          store.isScreenSharing = true;
          console.log("[Socket] whoIsSharing set to:", whoIsSharing.value);
          console.log("[Socket] Ready to receive screen share tracks");
        } else if (initialSharing === socketId) {
          console.log("[Socket] We are the one sharing (rejoining)");
          whoIsSharing.value = socketId;
          store.isScreenSharing = true;
        } else {
          console.log("[Socket] No one is sharing yet");
        }

        // DON'T initialize local stream automatically - let user enable camera/mic manually
        // This prevents sending disabled tracks to peers

        // Create offers to existing participants (except yourself)
        // Only if we already have media (which we don't on first join - that's OK)
        participantsList.forEach((p: any) => {
          if (p.socketId !== socketId) {
            console.log(
              "[WebRTC] Will create offer to:",
              p.socketId,
              p.username,
              "when we have media",
            );
            // They will send us offer, we'll answer
          }
        });
      },
    );

    socket.on(
      "user-connected",
      async ({
        socketId: newSocketId,
        username: newUsername,
        participants: participantsList,
        host,
        coHosts,
      }) => {
        console.log("[Socket] User connected:", newSocketId, newUsername);
        console.log("[Socket] Updated host:", host);
        console.log("[Socket] Updated co-hosts:", coHosts);

        // Update participants in store
        participants.value = participantsList;
        hostSocketId.value = host;
        coHostSocketIds.value = coHosts || [];
        store.addSocketParticipant(newSocketId, newUsername);

        // Show toast notification for new user
        onToast?.(
          "info",
          "Participant Joined",
          `${newUsername} has joined the call`,
        );

        // CRITICAL FIX: Always create offer to new user if we have ANY local stream
        // This matches index-backup.vue logic (line 950)
        // Don't check for enabled tracks - just check if stream exists
        // The tracks will be sent regardless of enabled state
        const hasLocalMedia =
          localStream.value && localStream.value.getTracks().length > 0;
        const isSharing = store.isScreenSharing && localScreenStream;

        if (hasLocalMedia || isSharing) {
          console.log(
            "[WebRTC] We have local media, creating offer for new user:",
            newSocketId,
          );
          await createOffer(newSocketId);
        } else {
          console.log(
            "[WebRTC] No local media, waiting for offer from:",
            newSocketId,
          );
        }
      },
    );

    socket.on(
      "user-disconnected",
      ({
        socketId: disconnectedSocketId,
        participants: participantsList,
        host,
        coHosts,
        hostTransferred,
        newHost,
        username: disconnectedUsername,
      }) => {
        console.log("[Socket] User disconnected:", disconnectedSocketId);
        console.log(
          "[Socket] Remaining participants count:",
          participantsList.length,
        );
        console.log("[Socket] Updated host:", host);
        console.log("[Socket] Updated co-hosts:", coHosts);

        if (hostTransferred && newHost) {
          console.log("[Socket] Host transferred to:", newHost);
        }

        // Remove participant from store FIRST
        const removedParticipant = store.participants.find(
          (p) => p.id === disconnectedSocketId,
        );
        store.removeParticipant(disconnectedSocketId);

        // Update participants in store
        participants.value = participantsList;
        hostSocketId.value = host;
        coHostSocketIds.value = coHosts || [];

        // Show toast notification
        if (removedParticipant) {
          onToast?.(
            "info",
            "Participant Left",
            `${removedParticipant.name} has left the call`,
          );
        }

        // Clear chat history if room is now empty (no participants left)
        console.log(
          "[Socket] Checking if room empty. Participants:",
          participantsList.length,
        );
        if (participantsList.length === 0) {
          console.log(
            "[Socket] ✅ Room is now empty, clearing chat history for room:",
            roomId,
          );
          store.clearChatHistory(roomId);
        }

        // Close peer connection
        closePeerConnection(disconnectedSocketId);
      },
    );

    socket.on("webrtc-offer", async ({ socketId: remoteSocketId, offer }) => {
      console.log("[Socket] Received offer from:", remoteSocketId);
      await handleOffer(remoteSocketId, offer);
    });

    socket.on("webrtc-answer", async ({ socketId: remoteSocketId, answer }) => {
      console.log("[Socket] Received answer from:", remoteSocketId);
      await handleAnswer(remoteSocketId, answer);
    });

    socket.on(
      "webrtc-ice-candidate",
      async ({ socketId: remoteSocketId, candidate }) => {
        console.log("[Socket] Received ICE candidate from:", remoteSocketId);
        await handleIceCandidate(remoteSocketId, candidate);
      },
    );

    socket.on(
      "chat-message",
      ({ socketId: senderSocketId, username: senderUsername, message }) => {
        console.log("[Socket] Received chat message from:", senderUsername);
        store.receiveMessage(senderSocketId, senderUsername, message);
      },
    );

    socket.on("mic-toggled", ({ socketId: remoteSocketId, enabled }) => {
      console.log("[Socket] User toggled mic:", remoteSocketId, enabled);
      store.updateParticipantMedia(remoteSocketId, { isMuted: !enabled });
    });

    socket.on(
      "camera-toggled",
      ({ socketId: remoteSocketId, enabled, streamId }) => {
        console.log("[Socket] User toggled camera:", remoteSocketId, enabled);
        console.log("[Socket] 🎯 Camera streamId:", streamId?.substring(0, 8));

        // Store stream type mapping
        if (enabled && streamId) {
          streamTypeMap.set(streamId, "camera");
          console.log(
            "[Socket] ✅ Mapped streamId",
            streamId.substring(0, 8),
            "→ camera",
          );
        }

        store.updateParticipantMedia(remoteSocketId, { isVideoOff: !enabled });
      },
    );

    socket.on("sharing-started", ({ socketId: sharerSocketId, streamId }) => {
      console.log("[Socket] 🎥 User started sharing:", sharerSocketId);
      console.log(
        "[Socket] 🎯 Screen share streamId:",
        streamId?.substring(0, 8),
      );
      console.log("[Socket] My socket ID:", socket?.id);
      console.log("[Socket] Am I the sharer?", sharerSocketId === socket?.id);

      // Store stream type mapping
      if (streamId) {
        streamTypeMap.set(streamId, "screen");
        console.log(
          "[Socket] ✅ Mapped streamId",
          streamId.substring(0, 8),
          "→ screen",
        );
      }

      whoIsSharing.value = sharerSocketId;
      console.log("[Socket] whoIsSharing set to:", whoIsSharing.value);

      // Set isScreenSharing to show screen share view
      store.isScreenSharing = true;
      console.log("[Socket] store.isScreenSharing set to true");

      // Switch to grid view when someone starts sharing
      store.setTabActive("grid");

      // Show toast notification if someone else is sharing
      if (sharerSocketId !== socket?.id) {
        const sharer = participants.value.find(
          (p: any) => p.socketId === sharerSocketId,
        );
        if (sharer) {
          onToast?.(
            "info",
            "Screen Share Started",
            `${sharer.username} is sharing their screen`,
          );
        }
      }
    });

    socket.on("stop-sharing", ({ socketId: sharerSocketId }) => {
      console.log("[Socket] User stopped sharing:", sharerSocketId);

      // Clear whoIsSharing if it was this user
      if (whoIsSharing.value === sharerSocketId) {
        whoIsSharing.value = null;
        store.isScreenSharing = false;
        store.showSidePanel
          ? store.setTabActive("participants")
          : store.setTabActive("chat");
        console.log(
          "[Socket] whoIsSharing cleared, isScreenSharing set to false",
        );
      }

      // Remove screen share stream - create NEW Map instance
      const newScreenMap = new Map(screenShareStreams.value);
      newScreenMap.delete(sharerSocketId);
      screenShareStreams.value = newScreenMap;
    });

    socket.on("recording-started", ({ socketId: recorderSocketId }) => {
      console.log("[Socket] Recording started by:", recorderSocketId);
      store.isRecording = true;
    });

    socket.on("recording-stopped", ({ socketId: recorderSocketId }) => {
      console.log("[Socket] Recording stopped by:", recorderSocketId);
      store.isRecording = false;
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      isConnected.value = false;
    });

    socket.on("room-full", () => {
      console.error("[Socket] Room is full!");
      alert("Room is full. Maximum 10 participants allowed.");
    });

    // Co-host management
    socket.on(
      "cohost-assigned",
      ({
        socketId: coHostSocketId,
        assignedBy,
        assignedByUsername,
        participants: participantsList,
        coHosts,
      }) => {
        console.log(
          "[Socket] Co-host assigned:",
          coHostSocketId,
          "by",
          assignedByUsername,
        );
        participants.value = participantsList;
        coHostSocketIds.value = coHosts || [];

        // Show toast for the newly assigned co-host
        const coHost = participantsList.find(
          (p: any) => p.socketId === coHostSocketId,
        );
        if (coHost) {
          onToast?.(
            "success",
            "Co-host Assigned",
            `${coHost.username} is now a co-host`,
          );
        }
      },
    );

    socket.on(
      "cohost-removed",
      ({
        socketId: removedSocketId,
        removedBy,
        removedByUsername,
        participants: participantsList,
        coHosts,
      }) => {
        console.log(
          "[Socket] Co-host removed:",
          removedSocketId,
          "by",
          removedByUsername,
        );
        participants.value = participantsList;
        coHostSocketIds.value = coHosts || [];

        // Show toast for removed co-host
        const removedUser = participantsList.find(
          (p: any) => p.socketId === removedSocketId,
        );
        if (removedUser) {
          onToast?.(
            "info",
            "Co-host Removed",
            `${removedUser.username} is no longer a co-host`,
          );
        }
      },
    );

    // Kick event
    socket.on(
      "participant-kicked",
      ({
        socketId: kickedSocketId,
        username: kickedUsername,
        kickedBy,
        kickedByUsername,
        participants: participantsList,
      }) => {
        console.log(
          "[Socket] Participant kicked:",
          kickedSocketId,
          kickedUsername,
          "by",
          kickedByUsername,
        );
        participants.value = participantsList;

        // Remove peer connection and streams
        closePeerConnection(kickedSocketId);
        screenShareStreams.value.delete(kickedSocketId);
        triggerRef(screenShareStreams); // Force Vue to detect change

        // Show toast notification
        onToast?.(
          "warn",
          "Participant Kicked",
          `${kickedUsername} was removed by ${kickedByUsername}`,
        );
      },
    );

    socket.on("kicked", ({ roomId, kickedBy, kickedByUsername }) => {
      console.log("[Socket] You were kicked by:", kickedByUsername);

      // Show toast and redirect
      onToast?.(
        "error",
        "You Were Kicked",
        `You were removed from the call by ${kickedByUsername}`,
      );

      // Cleanup and redirect
      setTimeout(() => {
        leaveMeeting();
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }, 2000);
    });

    // Rename event
    socket.on(
      "participant-renamed",
      ({
        socketId: renamedSocketId,
        oldUsername,
        newUsername,
        participants: participantsList,
      }) => {
        console.log(
          "[Socket] Participant renamed:",
          oldUsername,
          "->",
          newUsername,
        );
        participants.value = participantsList;

        // Update in store
        const participant = store.participants.find(
          (p) => p.id === renamedSocketId,
        );
        if (participant) {
          participant.name = newUsername;
        }

        // Show toast notification
        onToast?.(
          "info",
          "Name Changed",
          `${oldUsername} is now ${newUsername}`,
        );
      },
    );
  };

  /**   * Renegotiate with all peers (send new offers)
   */
  const renegotiateAll = async () => {
    const mySocketId = socket?.id;
    if (!mySocketId) return;

    for (const [remoteSocketId, pc] of peerConnections.entries()) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.emit("webrtc-offer", {
          roomId,
          offer,
          targetId: remoteSocketId,
        });

        console.log("[WebRTC] Renegotiation offer sent to:", remoteSocketId);
      } catch (error) {
        console.error(
          "[WebRTC] Renegotiation failed for:",
          remoteSocketId,
          error,
        );
      }
    }
  };

  /**   * Toggle microphone
   */
  const toggleMic = async () => {
    if (!socket) return;

    if (store.isMuted) {
      // Enable mic - add audio track
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        const audioTrack = newStream.getAudioTracks()[0];

        // Add to local stream - preserve existing video tracks!
        if (localStream.value) {
          // Check if video tracks exist
          const hasVideoTracks = localStream.value.getVideoTracks().length > 0;
          console.log(
            "[Media] Existing localStream has video tracks:",
            hasVideoTracks,
          );

          // Just add audio track to existing stream
          localStream.value.addTrack(audioTrack);
        } else {
          // No existing stream, use the new one
          localStream.value = newStream;
        }

        // Update store FIRST
        store.isMuted = false;
        const you = store.participants.find((p) => p.isYou);
        if (you) you.isMuted = false;

        // Add to all existing peer connections
        peerConnections.forEach((pc) => {
          pc.addTrack(audioTrack, localStream.value!);
        });

        // Create offers for ALL participants (like index-backup.vue)
        const mySocketId = socket.id;
        for (const participant of store.participants) {
          const peerId = participant.id;
          if (peerId !== mySocketId) {
            await createOffer(peerId);
          }
        }

        console.log("[Media] Mic enabled");

        // Broadcast status AFTER creating offers
        socket.emit("mic-toggled", { roomId: store.roomId, enabled: true });
      } catch (error) {
        console.error("[Media] Failed to enable mic:", error);
      }
    } else {
      // Disable mic - remove audio track
      if (localStream.value) {
        // Remove audio tracks from peer connections
        peerConnections.forEach((pc) => {
          const senders = pc.getSenders();
          const audioSender = senders.find((s) => s.track?.kind === "audio");
          if (audioSender && audioSender.track) {
            pc.removeTrack(audioSender);
          }
        });

        // Stop and remove from local stream
        const audioTracks = localStream.value.getAudioTracks();
        audioTracks.forEach((track) => {
          track.stop();
          localStream.value?.removeTrack(track);
        });

        // Update store FIRST
        store.isMuted = true;
        const you = store.participants.find((p) => p.isYou);
        if (you) you.isMuted = true;

        // Create offers for ALL participants
        const mySocketId = socket.id;
        for (const participant of store.participants) {
          const peerId = participant.id;
          if (peerId !== mySocketId) {
            await createOffer(peerId);
          }
        }

        console.log("[Media] Mic disabled");

        // Broadcast status
        socket.emit("mic-toggled", { roomId: store.roomId, enabled: false });
      }
    }
  };

  /**
   * Toggle camera
   */
  const toggleVideo = async () => {
    if (!socket) return;

    // === TURN ON CAMERA ===
    if (store.isVideoOff) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });

        const videoTrack = camStream.getVideoTracks()[0];

        // Attach to local UI stream
        if (localStream.value) {
          localStream.value.addTrack(videoTrack);
        } else {
          localStream.value = new MediaStream([videoTrack]);
        }

        // Add track to ALL existing peer connections
        peerConnections.forEach((pc, peerId) => {
          console.log("[WebRTC] Adding video track to PC for", peerId);
          pc.addTrack(videoTrack, localStream.value!);
        });

        // Small delay to let browser process the track addition
        await new Promise((resolve) => setTimeout(resolve, 100));

        store.isVideoOff = false;
        const you = store.participants.find((p) => p.isYou);
        if (you) you.isVideoOff = false;

        // Create offers for ALL participants (force renegotiation)
        const mySocketId = socket.id;
        for (const participant of store.participants) {
          const peerId = participant.id;
          if (peerId !== mySocketId) {
            console.log(
              "[Media] Creating offer for",
              peerId,
              "with video track",
            );
            await createOffer(peerId);
          }
        }

        console.log("[Media] Camera enabled");

        socket.emit("camera-toggled", {
          roomId: store.roomId,
          enabled: true,
          streamId: localStream.value.id, // ← Send streamId
        });
      } catch (error) {
        console.error("[Media] Failed to enable camera:", error);
      }

      return;
    }

    // === TURN OFF CAMERA ===
    if (localStream.value) {
      peerConnections.forEach((pc, peerId) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          console.log("[WebRTC] Removing video sender from PC for", peerId);
          pc.removeTrack(sender);
          // negotiationneeded WILL fire automatically
        }
      });

      localStream.value.getVideoTracks().forEach((track) => {
        track.stop();
        localStream.value?.removeTrack(track);
      });
    }

    store.isVideoOff = true;
    const you = store.participants.find((p) => p.isYou);
    if (you) you.isVideoOff = true;

    // Create offers for ALL participants (force renegotiation)
    const mySocketId = socket.id;
    for (const participant of store.participants) {
      const peerId = participant.id;
      if (peerId !== mySocketId) {
        await createOffer(peerId);
      }
    }

    console.log("[Media] Camera disabled");

    socket.emit("camera-toggled", {
      roomId: store.roomId,
      enabled: false,
    });
  };

  /**
   * Toggle screen share
   */
  const toggleScreenShare = async () => {
    if (!socket) return;

    if (store.isScreenSharing) {
      // Stop sharing
      if (localScreenStream) {
        // Remove screen tracks from peer connections
        peerConnections.forEach((pc) => {
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            if (
              sender.track &&
              localScreenStream?.getTracks().includes(sender.track)
            ) {
              pc.removeTrack(sender);
            }
          });
        });

        // Stop screen tracks
        localScreenStream.getTracks().forEach((track) => track.stop());
        localScreenStream = null;

        // Update store and whoIsSharing
        store.isScreenSharing = false;
        whoIsSharing.value = null;
        store.showSidePanel
          ? store.setTabActive("participants")
          : store.setTabActive("chat");

        // Notify others
        socket.emit("stop-sharing", { roomId: store.roomId });

        // Create offers for ALL participants (like index-backup.vue)
        const mySocketId = socket.id;
        for (const participant of store.participants) {
          const peerId = participant.id;
          if (peerId !== mySocketId) {
            await createOffer(peerId);
          }
        }

        console.log("[Media] Screen share stopped");
      }
    } else {
      // Start sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        localScreenStream = markRaw(stream);

        store.isScreenSharing = true;
        store.setTabActive("grid");

        const mySocketId = socket.id;
        whoIsSharing.value = mySocketId || null;

        console.log("[Media] Screen share started, stream ID:", stream.id);
        console.log(
          "[Media] Screen tracks:",
          stream.getTracks().map((t) => `${t.kind}:${t.id.substring(0, 8)}`),
        );

        // ⚠️ CRITICAL: Notify others FIRST before adding tracks
        // This ensures whoIsSharing is set before ontrack fires
        socket.emit("sharing-started", {
          roomId: store.roomId,
          streamId: stream.id, // ← Send streamId
        });

        // Longer delay to ensure all peers receive the signal
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Add screen tracks to peer connections as SEPARATE stream
        const screenTracks = localScreenStream.getTracks();
        peerConnections.forEach((pc, peerId) => {
          console.log(
            "[Media] Adding screen tracks to PC for",
            peerId,
            "with stream ID:",
            localScreenStream!.id,
          );
          screenTracks.forEach((track) => {
            pc.addTrack(track, localScreenStream!);
            console.log(
              `[Media] Added screen ${track.kind} track to ${peerId}`,
            );
          });
        });

        // Handle when user stops from browser UI
        const videoTrack = localScreenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
          console.log("[Media] Screen sharing ended by user");
          toggleScreenShare(); // Stop sharing
        };

        // Create offers for ALL participants (like index-backup.vue)
        for (const participant of store.participants) {
          const peerId = participant.id;
          if (peerId !== mySocketId) {
            await createOffer(peerId);
          }
        }
      } catch (error) {
        console.error("[Media] Failed to start screen share:", error);
      }
    }
  };

  /**
   * Send chat message
   */
  const sendMessage = (message: string) => {
    if (socket && message.trim()) {
      socket.emit("chat-message", {
        roomId: store.roomId,
        message: message.trim(),
      });
      // Don't add to store here - let the socket echo back handle it
    }
  };

  /**
   * Leave meeting and cleanup
   */
  const leaveMeeting = () => {
    // Check if we are the last person in the room before disconnecting
    const remainingParticipants = store.participants.filter(
      (p) => !p.isYou,
    ).length;
    console.log(
      "[WebRTC] Leaving meeting. Remaining participants:",
      remainingParticipants,
    );

    if (remainingParticipants === 0) {
      console.log(
        "[WebRTC] ✅ We are the last person, clearing chat history before leaving",
      );
      store.clearChatHistory(roomId);
    }

    // Stop all tracks
    if (localStream.value) {
      localStream.value.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    peerConnections.forEach((pc, socketId) => {
      closePeerConnection(socketId);
    });

    // Clear local storage
    localStorage.removeItem(`chat_history_${roomId}`);
    localStorage.removeItem("username");

    // Disconnect socket
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    // Reset store
    // store.resetMeeting()

    console.log("[WebRTC] Left meeting");
  };

  /**
   * Kick participant (host/co-host only)
   */
  const kickParticipant = (targetSocketId: string) => {
    if (!socket) return;

    socket.emit("kick-participant", { roomId, targetSocketId });
  };

  /**
   * Assign co-host (host only)
   */
  const assignCoHost = (targetSocketId: string) => {
    if (!socket) return;

    socket.emit("assign-cohost", { roomId, targetSocketId });
  };

  /**
   * Remove co-host (host only)
   */
  const removeCoHostRole = (targetSocketId: string) => {
    if (!socket) return;

    socket.emit("remove-cohost", { roomId, targetSocketId });
  };

  /**
   * Rename current user
   */
  const renameCurrentUser = (newUsername: string) => {
    if (!socket || !newUsername.trim()) return;

    socket.emit("rename-participant", {
      roomId,
      newUsername: newUsername.trim(),
    });
  };

  /**
   * Emit recording started
   */
  const emitRecordingStarted = () => {
    if (!socket) return;
    socket.emit("recording-started", { roomId });
    console.log("[Socket] 📹 Emitted recording-started");
  };

  /**
   * Emit recording stopped
   */
  const emitRecordingStopped = () => {
    if (!socket) return;
    socket.emit("stop-recording", { roomId });
    console.log("[Socket] 🛑 Emitted stop-recording");
  };

  // Auto connect immediately when composable is called
  connectSocket();

  // Cleanup on unmount
  onUnmounted(() => {
    leaveMeeting();
  });

  return {
    isConnected,
    localStream,
    remoteStreams,
    screenShareStreams,
    whoIsSharing,
    participants,
    hostSocketId,
    coHostSocketIds,
    getLocalScreenStream: () => localScreenStream,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    leaveMeeting,
    kickParticipant,
    assignCoHost,
    removeCoHostRole,
    renameCurrentUser,
    emitRecordingStarted,
    emitRecordingStopped,
  };
};
