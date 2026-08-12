// Everything the /about-me bento grid renders lives here so it's one place
// to edit instead of hunting through JSX. Fields marked EDIT ME are
// placeholders — swap them for the real thing whenever you have it; nothing
// else in the page needs to change.
//
// githubUsername, contact.email and contact.github are already filled in
// with real values pulled from this project (git config / the address this
// session is running as). Everything else genuinely unknowable from outside
// (travel history, coffee count, coding hours, last-played track) is a
// clearly-marked placeholder — wire up functions/dashboard-data (see its
// README) to replace hours/coffees/last-played with live data.

export const aboutMe = {
    name: "Abir Hirani",
    githubUsername: "Abirh10",

    journey: {
        label: "Windsor, ON → San Francisco, CA",
        from: { lat: 42.3149, lng: -83.0364, color: "#ff7a33", label: "Windsor, ON" },
        to: { lat: 37.7749, lng: -122.4194, color: "#4ade80", label: "San Francisco, CA" },
    },

    favTool: "React",

    // Tools actually used to build this project — real, not placeholder.
    tools: [
        "React",
        "TypeScript",
        "JavaScript",
        "Redux Toolkit",
        "Tailwind CSS",
        "Vite",
        "Appwrite",
    ],

    // Shown under the scratch card until it's scratched off, then swapped
    // for a new random one. Emoji instead of hot-linked GIFs so this page
    // has zero external image dependencies.
    scratchReveals: ["☕", "🐛", "🚀", "🎮", "🎧", "💻"],

    // Hours Coding / Coffees Drank are derived from real GitHub activity
    // (functions/dashboard-data's `github` route, no API key needed) rather
    // than requiring WakaTime setup: hours ≈ total contributions in the last
    // year × hoursPerContribution. GitHub doesn't expose actual time spent,
    // so this is an explicit, tunable heuristic, not a measurement — adjust
    // it to taste. fallbackHours is only used before the function is deployed.
    hoursPerContribution: 1.5,
    fallbackHours: 500,

    // EDIT ME — placeholder until the Spotify route is deployed.
    fallbackTrack: {
        title: "U.N.I",
        artist: "NAV",
        album: "OMW2 REXDALE",
        albumImageUrl: null,
        songUrl: "#",
        isPlaying: false,
    },

    contact: [
        { label: "Email", href: "mailto:beko91872@gmail.com" },
        { label: "GitHub", href: "https://github.com/Abirh10" },
        // EDIT ME — add your real LinkedIn/other links.
        { label: "LinkedIn", href: "https://linkedin.com/in/your-handle" },
        { label: "Blog", href: "/" },
    ],
};

export default aboutMe;
