<template>
    <a class="github" href="https://github.com/orhanemree/ne-kadar-taniyorsun">
        <img src="https://api.iconify.design/akar-icons:github-fill.svg" alt="github icon">
    </a>
    <div class="w-screen min-h-full" v-if="room.active">
        <div class="w-full flex items-center justify-evenly p-5 sm:text-lg text-base">
            <div class="_flex gap-2">
                Room ID: 
                <span class="bg-green-300">{{ input.roomId }}</span>
            </div>
            <div class="_flex gap-2">
                Question: 
                <span class="circle">{{ room.current }}/5</span>
            </div>
        </div>
        <ul class="w-screen flex items-center justify-evenly mb-3 text-lg">
            <li class="font-bold sm:text-2xl text-lg _flex gap-2" v-for="client in room.clients" :key="client">
                {{ client.username }}
                <span class="circle">{{ client.point }}</span>
            </li>
        </ul>
        <div class="w-full _flex">
            <form class="w-2/3" disa @submit.prevent="submitAnswer">
                <h2>{{ room.question[0] }}</h2>
                <div>Your</div>
                <input type="text" v-model.trim="input.self">
                <div>Your's</div>
                <input type="text" v-model.trim="input.partner">
                <button :disabled="room.warn || !input.self || input.partner">Submit Answer</button>
                <div v-if="room.warn" class="text-orange-800">{{ room.warn }}</div>
            </form>
        </div>
    </div>
    <div v-else class="w-full min-h-screen _flex sm:flex-row flex-col gap-8 p-8">
        <form @submit.prevent="createRoom">
            <h1>Create Room</h1>
            <div>Username</div>
            <input type="text" v-model.trim="input.username">
            <button :disabled="!input.username">Create</button>
        </form>
        <div>or</div>
        <form @submit.prevent="joinRoom">
            <h1>Join Room</h1>
            <div>{{ error.join }}</div>
            <div>Room ID</div>
            <input type="text" v-model.trim="input.roomId">
            <div>Username</div>
            <input type="text" v-model.trim="input.username">
            <button :disabled="!input.roomId || !input.username">Join</button>
        </form>
    </div>
</template>

<script>
import { getDatabase, ref, onValue } from "firebase/database";

export default {
    data(){
        return{
            input: { username: "", roomId: "", self: "", partner: "" },
            error : { join: "" },
            room: { active: false, warn: false, clients: [], current: "", question: "" },
        }
    },
    methods: {
        async createRoom(){
            if (this.input.username){
                let res = await fetch("/api/create", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username: this.input.username })
                });
                res = await res.json();
                this.handleResponse(res);
            }
        },
        async joinRoom(){
            if (this.input.roomId && this.input.username){
                let res = await fetch("/api/join", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ roomId: this.input.roomId, username: this.input.username })
                });
                res = await res.json();
                this.handleResponse(res);
            }
        },
        handleResponse(res){
            if ("error" in res){
                // TODO: show error in UI
            } else {
                this.room.active = true;
                this.input.roomId = res.roomId;
                localStorage.setItem("nkt_user_uuid", res.uuid);
                onValue(ref(getDatabase(), `/room/${res.roomId}`), snapshot => {
                    const data = snapshot.val();
                    console.log(data);
                    this.room.clients = data.client;
                    this.room.current = data.current;
                    this.room.question = data.question;
                    this.room.warn = Object.keys(data.client).length < 2 ? "Waiting for your partner." : false;
                });
            }
        },
        async submitAnswer(){
            if (!this.room.warn && this.input.self && this.input.partner){
                let res = await fetch("/api/submit-answer", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({...this.input, uuid: localStorage.getItem("nkt_user_uuid")})
                });
                res = await res.json();
                console.log(res);
                this.room.warn = res.message === "waiting" ? "Waiting for your partner." : false;
                this.input.self = "";
                this.input.partner = "";
            }
        }
    }
}
</script>

<style scoped>
.github{
    @apply
    absolute
    top-0 right-0
    opacity-100
    transition
    hover:opacity-70
    p-3
}

.github img{
    @apply
    w-8 h-8
}

.circle{
    @apply
    flex
    items-center justify-center
    w-8 h-8
    p-5
    rounded-[50%]
    bg-green-300
}
</style>