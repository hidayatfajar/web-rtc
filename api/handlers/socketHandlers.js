import {
  getRoomState,
  addParticipant,
  removeParticipant,
  getParticipants,
  setSharing,
  clearSharing,
  setRecording,
  clearRecording,
  cleanupRoom,
  setCoHost,
  removeCoHost,
  renameParticipant,
  isHostOrCoHost,
  getHost,
  setStreamType,
  getAllStreamTypes,
} from "./roomManager.js";

export function setupSocketHandlers(io, socket) {
  console.log("connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    console.log(
      `[JOIN] ${socket.id} requesting to join room ${roomId} as ${username}`,
    );

    const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    console.log("rooms of socket:", Array.from(socket.rooms));

    if (roomSize >= 10) {
      socket.emit("room-full", roomId);
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;

    addParticipant(roomId, socket.id, username);

    const roomState = getRoomState(roomId);
    const participants = getParticipants(roomId);

    console.log(`[JOIN] Participants in room ${roomId}:`, participants);
    console.log(`[JOIN] Sending joined-room event to ${socket.id}`);

    const streamTypes = getAllStreamTypes(roomId);

    socket.emit("joined-room", {
      roomId,
      socketId: socket.id,
      username,
      participants,
      whoIsSharing: roomState.whoIsSharing,
      isRecording: !!roomState.whoIsRecording,
      whoIsRecording: roomState.whoIsRecording,
      host: roomState.host,
      coHosts: roomState.coHosts,
      streamTypes,
    });

    socket.to(roomId).emit("user-connected", {
      socketId: socket.id,
      username,
      participants,
      host: roomState.host,
      coHosts: roomState.coHosts,
    });

    console.log(
      `[JOIN] ✅ ${socket.id} (${username}) joined room ${roomId}. Total participants: ${participants.length}`,
    );
  });

  // WebRTC signaling relay
  socket.on("webrtc-offer", ({ roomId, offer, targetId }) => {
    if (targetId) {
      io.to(targetId).emit("webrtc-offer", {
        socketId: socket.id,
        username: socket.data.username,
        offer,
      });
    } else {
      socket.to(roomId).emit("webrtc-offer", {
        socketId: socket.id,
        username: socket.data.username,
        offer,
      });
    }
  });

  socket.on("webrtc-answer", ({ roomId, answer, targetId }) => {
    if (targetId) {
      io.to(targetId).emit("webrtc-answer", {
        socketId: socket.id,
        username: socket.data.username,
        answer,
      });
    } else {
      socket.to(roomId).emit("webrtc-answer", {
        socketId: socket.id,
        username: socket.data.username,
        answer,
      });
    }
  });

  socket.on("webrtc-ice-candidate", ({ roomId, candidate, targetId }) => {
    if (targetId) {
      io.to(targetId).emit("webrtc-ice-candidate", {
        socketId: socket.id,
        username: socket.data.username,
        candidate,
      });
    } else {
      socket.to(roomId).emit("webrtc-ice-candidate", {
        socketId: socket.id,
        username: socket.data.username,
        candidate,
      });
    }
  });

  // Chat message
  socket.on("chat-message", ({ roomId, message }) => {
    io.to(roomId).emit("chat-message", {
      socketId: socket.id,
      username: socket.data.username,
      message,
      timestamp: new Date(),
    });
  });

  // Media toggles
  socket.on("mic-toggled", ({ roomId, enabled }) => {
    socket.to(roomId).emit("mic-toggled", {
      socketId: socket.id,
      username: socket.data.username,
      enabled,
    });
    console.log(
      `[MEDIA] ${socket.id} (${socket.data.username}) mic ${enabled ? "enabled" : "disabled"}`,
    );
  });

  socket.on("camera-toggled", ({ roomId, enabled, streamId }) => {
    // Track stream type in room state
    if (enabled && streamId) {
      setStreamType(roomId, socket.id, streamId, "camera");
    }

    socket.to(roomId).emit("camera-toggled", {
      socketId: socket.id,
      username: socket.data.username,
      enabled,
      streamId,
    });
    console.log(
      `[MEDIA] ${socket.id} (${socket.data.username}) camera ${enabled ? "enabled" : "disabled"}${streamId ? ` (stream: ${streamId.substring(0, 8)})` : ""}`,
    );
  });

  // Screen sharing
  socket.on("sharing-started", ({ roomId, streamId }) => {
    setSharing(roomId, socket.id);

    // Track stream type in room state
    if (streamId) {
      setStreamType(roomId, socket.id, streamId, "screen");
    }

    socket.to(roomId).emit("sharing-started", {
      socketId: socket.id,
      username: socket.data.username,
      streamId,
    });
    console.log(
      `socket ${socket.id} (${socket.data.username}) started sharing in room ${roomId}${streamId ? ` (stream: ${streamId.substring(0, 8)})` : ""}`,
    );
  });

  socket.on("stop-sharing", ({ roomId }) => {
    clearSharing(roomId, socket.id);
    socket.to(roomId).emit("stop-sharing", {
      socketId: socket.id,
      username: socket.data.username,
    });
    console.log(
      `socket ${socket.id} (${socket.data.username}) stopped sharing in room ${roomId}`,
    );
  });

  // Recording
  socket.on("recording-started", ({ roomId }) => {
    setRecording(roomId, socket.id);
    io.to(roomId).emit("recording-started", {
      socketId: socket.id,
      username: socket.data.username,
    });
    console.log(
      `socket ${socket.id} (${socket.data.username}) started recording in room ${roomId}`,
    );
  });

  socket.on("stop-recording", ({ roomId }) => {
    clearRecording(roomId, socket.id);
    io.to(roomId).emit("recording-stopped", {
      socketId: socket.id,
      username: socket.data.username,
    });
    console.log(
      `socket ${socket.id} (${socket.data.username}) stopped recording in room ${roomId}`,
    );
  });

  // Disconnect
  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    const username = socket.data.username;

    if (roomId) {
      const roomState = getRoomState(roomId);
      const wasHost = roomState.host === socket.id;

      removeParticipant(roomId, socket.id);
      const participants = getParticipants(roomId);

      // Get new host if it changed
      const newHost = wasHost ? roomState.host : null;

      io.to(roomId).emit("user-disconnected", {
        socketId: socket.id,
        username,
        participants,
        host: roomState.host,
        coHosts: roomState.coHosts,
        hostTransferred: wasHost && newHost !== null,
        newHost: newHost,
      });

      console.log(
        `socket ${socket.id} (${username}) disconnected from room ${roomId}. Remaining participants:`,
        participants,
      );

      if (wasHost && newHost) {
        console.log(`Host transferred from ${socket.id} to ${newHost}`);
      }

      cleanupRoom(roomId);
    }

    console.log("disconnected:", socket.id);
  });

  // Host management
  socket.on("assign-cohost", ({ roomId, targetSocketId }) => {
    const roomState = getRoomState(roomId);

    if (roomState.host !== socket.id) {
      socket.emit("error", { message: "Only host can assign co-host" });
      return;
    }

    setCoHost(roomId, targetSocketId);
    const participants = getParticipants(roomId);

    io.to(roomId).emit("cohost-assigned", {
      socketId: targetSocketId,
      assignedBy: socket.id,
      assignedByUsername: socket.data.username,
      participants,
      coHosts: roomState.coHosts,
    });

    console.log(
      `${socket.id} assigned ${targetSocketId} as co-host in room ${roomId}`,
    );
  });

  socket.on("remove-cohost", ({ roomId, targetSocketId }) => {
    const roomState = getRoomState(roomId);

    if (roomState.host !== socket.id) {
      socket.emit("error", { message: "Only host can remove co-host" });
      return;
    }

    removeCoHost(roomId, targetSocketId);
    const participants = getParticipants(roomId);

    io.to(roomId).emit("cohost-removed", {
      socketId: targetSocketId,
      removedBy: socket.id,
      removedByUsername: socket.data.username,
      participants,
      coHosts: roomState.coHosts,
    });

    console.log(
      `${socket.id} removed ${targetSocketId} as co-host in room ${roomId}`,
    );
  });

  socket.on("kick-participant", ({ roomId, targetSocketId }) => {
    const roomState = getRoomState(roomId);

    if (!isHostOrCoHost(roomId, socket.id)) {
      socket.emit("error", {
        message: "Only host or co-host can kick participants",
      });
      return;
    }

    if (targetSocketId === roomState.host || targetSocketId === socket.id) {
      socket.emit("error", { message: "Cannot kick host or self" });
      return;
    }

    const targetSocket = io.sockets.sockets.get(targetSocketId);
    const kickedUsername = targetSocket?.data?.username || "Unknown";

    removeParticipant(roomId, targetSocketId);
    const participants = getParticipants(roomId);

    if (targetSocket) {
      targetSocket.emit("kicked", {
        roomId,
        kickedBy: socket.id,
        kickedByUsername: socket.data.username,
      });
      targetSocket.leave(roomId);
    }

    socket.to(roomId).emit("participant-kicked", {
      socketId: targetSocketId,
      username: kickedUsername,
      kickedBy: socket.id,
      kickedByUsername: socket.data.username,
      participants,
    });

    socket.emit("participant-kicked", {
      socketId: targetSocketId,
      username: kickedUsername,
      kickedBy: socket.id,
      kickedByUsername: socket.data.username,
      participants,
    });

    console.log(
      `${socket.id} (${socket.data.username}) kicked ${targetSocketId} (${kickedUsername}) from room ${roomId}`,
    );
  });

  socket.on("rename-participant", ({ roomId, newUsername }) => {
    if (!newUsername || newUsername.trim() === "") {
      socket.emit("error", { message: "Username cannot be empty" });
      return;
    }

    const oldUsername = socket.data.username;
    socket.data.username = newUsername.trim();

    renameParticipant(roomId, socket.id, newUsername.trim());
    const participants = getParticipants(roomId);

    io.to(roomId).emit("participant-renamed", {
      socketId: socket.id,
      oldUsername,
      newUsername: newUsername.trim(),
      participants,
    });

    console.log(
      `${socket.id} renamed from ${oldUsername} to ${newUsername} in room ${roomId}`,
    );
  });
}
