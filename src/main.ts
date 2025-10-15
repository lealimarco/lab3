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
async function fhAttend() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");

  return fetch(`http://${FURHATURI}/furhat/attend?user=CLOSEST`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      enum: "CLOSEST",
    }),
  });
}

async function fhGetUser() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");

  return fetch(`http://${FURHATURI}/furhat/users`, {
    method: "GET",
    headers: myHeaders,
  })
    .then((response) => response.json())
    .then((data) => data.users || []); // return array of users (empty if none)
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

   fhAttend: fromPromise<any, null>(async () => {
      return fhAttend();
    }),
   fhGetUser: fromPromise<any, null>(async () => {
      return fhGetUser();
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
    Start: { after: { 1000: "GetUser" } },
  

    GetUser: {
      invoke: {
        src: "fhGetUser",      
        input: null,
        onDone: {
          target: "AttendUser",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },
    AttendUser: {
      invoke: {
        src: "fhAttend",      
        input: null,
        onDone: {
          target: "Next",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
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
          const said = input?.toLowerCase() || "";
          console.log("Analyzing user input:", said);
    
          if (said.includes("wow")) {
            await fhSay("You drive me crazy!");
            await fhSurprisedWithSound();
          } else if (said.includes("eye")) {
            await fhEyeRoll();
          } else if (said.includes("good")) {
            await fhSay("That's wonderful!");
            await fhBigSmile();
          } else if (said.includes("bad")) {
            await fhSay("Oh no, I'm sorry to hear that. But listen to this:");
            await fhPlayAudio("https://raw.githubusercontent.com/lealimarco/lab3/lab3/src/slim_shady_audio.wav");
            await fhBigSmile();
          } else if (said.includes("you")) {
            await fhSay("I'm doing great, thanks for asking!");
            await fhBigSmile();
          } else if (said.includes("bye")) {
            await fhSay("It was nice talking to you.");
            return "exit";
          } else if (said.includes("okay")) {
            await fhSay("Okay! Sounds good.");
          } else if (said.includes("yes")) {
            await fhSay("Awesome!");
          } else {
            await fhSay("If you want to quit say Bye. Otherwise, how are you doing?");
            await fhEyeRoll();
          }
    
          return "continue";
        }),
        input: ({ context }) => context.userSpeech,
        onDone: [
          {
            guard: ({ event }) => {
              console.log("React onDone event:", event.output);
              const result = event.output;
              return result === "exit";
            },
            target: "End",
          },
          { target: "Listen" },
        ],
        onError: { target: "Fail", actions: ({ event }) => console.error(event) },
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

