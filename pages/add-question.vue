<template>
    <div class="w-full min-h-screen _flex sm:flex-row flex-col gap-8 p-8">
        <form @submit.prevent="addNewQuestion">
            <h1>Add New Quesiton</h1>
            <div>Question</div>
            <input type="text" v-model="input.question">
            <button :disabled="!input.question">Add</button>
        </form>
    </div>
</template>

<script>
import { getDatabase, ref, set, push } from "firebase/database";

export default {
    data(){
        return{
            input: { question: "" }
        }
    },
    methods: {
        async addNewQuestion(){
            const dbRef = ref(getDatabase(), `/question`);
            await set(push(dbRef), this.input.question);
            location.reload();
        }
    }
}
</script>