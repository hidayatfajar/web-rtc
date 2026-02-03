// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  modules: ["nuxt-socket-io", "@nuxt/ui", "@pinia/nuxt"],
  css: ["~/assets/css/main.css"],

  // Runtime config untuk environment variables
  runtimeConfig: {
    public: {
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      stunServers: process.env.NUXT_PUBLIC_STUN_SERVERS || "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302",
      turnUrl: process.env.NUXT_PUBLIC_TURN_URL || "",
      turnUsername: process.env.NUXT_PUBLIC_TURN_USERNAME || "",
      turnCredential: process.env.NUXT_PUBLIC_TURN_CREDENTIAL || "",
    },
  },
  // devServer: {
  //   port: 3002,
  // },

  colorMode: {
    dataValue: "theme",
    preference: "light", // default value for users without a system preference
    fallback: "light", // fallback value if not system preference found
    // force to use light mode
    classSuffix: "",
  },

  io: {
    sockets: [
      {
        name: "main",
        url: process.env.NUXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      },
    ],
  },
});
