import { setup, createActor, fromPromise, assign } from "xstate";

const FURHATURI = "127.0.0.1:54321";

async function fhVoice(name: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encName = encodeURIComponent(name);
  return fetch(`http://${FURHATURI}/furhat/voice?name=${encName}`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

async function fhSay(text: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encText = encodeURIComponent(text);
  return fetch(`http://${FURHATURI}/furhat/say?text=${encText}&blocking=true`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}


// NEW GESTURES
async function fhBigSmile() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: "BigSmile",
      frames: [
        {
          "time":[0.32,0.64],
          "persist":false, // Optional
          "params":{
            "BROW_UP_LEFT":1,
            "BROW_UP_RIGHT":1,
            "SMILE_OPEN":0.4,
            "SMILE_CLOSED":0.7
            }
        },
        {
          "time":[3.0],
          "persist":false, // Optional
          "params":{
          "reset":true
          },
        },
        //ADD MORE TIME FRAMES IF YOUR GESTURE REQUIRES THEM
      ],
      class: "furhatos.gestures.Gesture",
    }),
  });
}

async function fhNeckMovement() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: "NeckMovement",
      frames: [
          {
            "time": [
              0.17, 1.0, 6.0
            ],
            "params": {
              "NECK_ROLL": -25.0,
              "NECK_PAN": -12.0,
              "NECK_TILT": -25.0
            }
          },
          {
              "time": [
                  3.0
              ],
              "params": { 
                  "reset": true
              }
          }
        ],
        class: "furhatos.gestures.Gesture"
    }),
  });
}

async function fhEyeRoll() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: "EyeRoll",
      frames: [
        {
          time: [0.2, 0.5],
          params: {
            EYE_ROLL_LEFT: 1,
            EYE_ROLL_RIGHT: 1
          }
        },
        {
          time: [1.0],
          params: { reset: true }
        }
      ],
      class: "furhatos.gestures.Gesture"
    }),
  });
}

async function fhGesture(text: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(
    `http://${FURHATURI}/furhat/gesture?name=${text}&blocking=true`,
    {
      method: "POST",
      headers: myHeaders,
      body: "",
    },
  );
}

async function fhListen() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/listen`, {
    method: "GET",
    headers: myHeaders,
  })
    .then((response) => response.body)
    .then((body) => body.getReader().read())
    .then((reader) => reader.value)
    .then((value) => JSON.parse(new TextDecoder().decode(value)).message);
}



// Enable user tracking (Furhat attends to the user)
async function fhGetUsers() {
  const response = await fetch(`http://${FURHATURI}/furhat/users`);
  return response.json();
}

async function fhAttendUser(userId: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/attend?user=${userId}`, {
    method: "POST",
    headers: myHeaders,
  });
}


// SOUND

async function fhPlayAudio(audioUrl: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encUrl = encodeURIComponent(audioUrl);

  // Use ?url= instead of ?text=
  return fetch(`http://${FURHATURI}/furhat/say?url=${encUrl}&blocking=true`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

async function fhSurprisedWithSound() {
  // Run the gesture first
  await fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: { "accept": "application/json" },
    body: JSON.stringify({
      name: "SurprisedWithSound",
      frames: [
        {
          time: [0.3, 1.0],
          params: {
            BROW_UP_LEFT: 1,
            BROW_UP_RIGHT: 1,
            JAW_OPEN: 0.8
          }
        },
        { time: [2.0], params: { reset: true } }
      ],
      class: "furhatos.gestures.Gesture"
    }),
  });

  // Then play audio from a hosted .wav URL
  await fhPlayAudio("https://furhat-files.s3.eu-west-1.amazonaws.com/sounds/elephant.wav");
}


// ---------------- LLM function ----------------
async function fetchLLM(messages: { role: string; content: string }[]): Promise<string> {
  const body = { model: "llama3.1", stream: false, messages };
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return data.message?.content?.trim() || "Sorry, I cannot respond right now.";
}


// X State Machine

const dmMachine = setup({
  actors: {


    fhVoice: fromPromise<any, null>(async () => {
      return fhVoice("en-US-EchoMultilingualNeural");
    }),
    fhHello: fromPromise<any, null>(async () => {
      return fhSay("Hi");
    }),
    fhL: fromPromise<any, null>(async () => {
     return fhListen();
   }),
   fhBigSmile: fromPromise<any, null>(async () => {
      return fhBigSmile();
    }),
   fhNeckMovement: fromPromise<any, null>(async () => {
      return fhNeckMovement();
    }),

    fhGetUsers: fromPromise(async () => {
      const users = await fhGetUsers();
      if (users.length > 0) {
        await fhAttendUser(users[0].id);
        console.log("Attending user:", users[0].id);
      } else {
        console.log("No users detected. Attending front.");
        await fetch(`http://${FURHATURI}/furhat/attend?location=front`, {
          method: "POST",
        });
      }
    }),

    fhPlayAudio: fromPromise<any, null>(async () => {
      return fhPlayAudio();
    }),

    fhSurprisedWithSound: fromPromise<any, null>(async () => {
      return fhSurprisedWithSound();
    }),

  },
}).createMachine({
  id: "root",
  context: {
    userSpeech: "",
  },
  initial: "Start",
  states: {
    Start: { after: { 1000: "TrackUser" } },
    
    TrackUser: {
      invoke: {
        src: "fhGetUsers",
        input: null,
        onDone: {
          target: "Next",
          actions: () => console.log("User tracking done"),
        },
        onError: {
          target: "Next",
          actions: () => console.error("Tracking error"),
        },
      },
    },

    Next: {
      invoke: {
        src: "fhHello",      
        input: null,
        onDone: {
        //   target: "Listen",
        //   actions: ({ event }) => console.log(event.output),
        // },
        // onError: {
        //   target: "Fail",
        //   actions: ({ event }) => console.error(event),
        // },

          target: "Smile",
          actions: ({ event }) => console.log("Said Hi:", event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },

    Smile: {
      invoke: {
        src: "fhBigSmile",
        input: null,
        onDone: {
          target: "Neck",
          actions: () => console.log("BigSmile gesture done"),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
      after: { 2000: "Neck"},
    },

    Neck: {
      invoke: {
        src: "fhNeckMovement",
        input: null,
        onDone: {
          target: "Talk2",
          actions: () => console.log("NeckMovement gesture done"),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },

    Talk2: {
      invoke: {
        src: fromPromise(async () => {
          return fhSay("How are you today?");
        }),
        onDone: { target: "Listen" },
      },
    },

    // Surprised: {
    //   invoke: {
    //     src: "fhSurprisedWithSound",
    //     onDone: {
    //       target: "Listen",
    //       actions: () => console.log("Played SurprisedWithSound gesture"),
    //     },
    //   },
    // },

    Listen: {
      invoke: {
        src: "fhL",
        onDone: {
          target: "React",
          actions: assign({
            userSpeech: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },
    React: {
      invoke: {
        src: fromPromise(async ({ input }) => {
          const said = (input || "").trim().toLowerCase();
          console.log("Analyzing user input:", said);
    
          if (said.includes("wow")) {
            await fhSay("You drive me crazy!");
            await fhSurprisedWithSound();
          } else if (said.includes("bad")) {
            await fhSay("Oh no, I'm sorry to hear that. But listen to this:");
            await fhPlayAudio("https://raw.githubusercontent.com/lealimarco/lab3/lab3/src/slim_shady_audio.wav");
            await fhBigSmile();
          } else if (said === "bye") {  // <-- EXACT match
            await fhSay("It was nice talking to you!");
            return "exit";
          } else {
            // Default fallback: Ask LLM for a response
            const llmReply = await fetchLLM([{ role: "user", content: said }]);
            await fhSay(llmReply);
            await fhEyeRoll();

            // Trigger gestures based on LLM content
            if (llmReply.includes("surprised")) await fhSurprisedWithSound();
          }
    
          return "continue"; // loop back to listening for everything else
        }),
        input: ({ context }) => context.userSpeech,
        onDone: [
          {
            guard: ({ event }) => {
              const result = event.output;
              return result === "exit";
            },
            target: "End",
          },
          { target: "Listen" },
        ],
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error("React state error:", event),
        },
      },
    },

    End: {
      entry: async () => {
        console.log("Conversation ended.");
        await fhSay("Goodbye!");
        // You can also stop listening explicitly:
        await fetch(`http://${FURHATURI}/furhat/listen/stop`, { method: "POST" });
      },
      type: "final",
    },

    Fail: {},
  },
});



const actor = createActor(dmMachine).start();
console.log(actor.getSnapshot().value);

actor.subscribe((snapshot) => {
  console.log(snapshot.value);
});

