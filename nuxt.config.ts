import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
    modules: ["@nuxtjs/tailwindcss"],

    css: ["@/assets/global.css"],

    serverMiddleware: [
        { path: "/api", handler: "~/server/index.js" },
    ],

    publicRuntimeConfig: {
        API_KEY: process.env.API_KEY,
        PROJECT_ID: process.env.PROJECT_ID,
        SENDER_ID: process.env.SENDER_ID,
        APP_ID: process.env.APP_ID
    }
});
