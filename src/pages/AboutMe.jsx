import React, { useEffect, useState } from 'react'
import {
    MapPin,
    Hand,
    Coffee,
    Clock,
    Music2,
    Heart,
    Link2,
    Wrench,
    RefreshCw,
} from 'lucide-react'
import { Container } from '../components'
import { BentoCard } from '../components/ui/bento-card'
import { GithubIcon } from '../components/ui/icons'
import Globe from '../components/ui/globe'
import { ScratchToReveal } from '../components/ui/scratch-to-reveal'
import { NumberTicker } from '../components/ui/number-ticker'
import { Marquee } from '../components/ui/marquee'
import { GitHubHeatmap } from '../components/ui/github-heatmap'
import { useDashboardData } from '../hooks/useDashboardData'
import { aboutMe } from '../data/about-me'

function pickScratchReveal(exclude) {
    const options = aboutMe.scratchReveals.filter((r) => r !== exclude)
    return options[Math.floor(Math.random() * options.length)]
}

function AboutMe() {
    const [scratchReveal, setScratchReveal] = useState(() => pickScratchReveal())

    const { data: githubData, isLive: githubIsLive } = useDashboardData('github', {
        contributions: [],
        totalContributions: null,
    })
    const { data: spotifyData, isLive: trackIsLive } = useDashboardData('spotify', {
        track: aboutMe.fallbackTrack,
    })

    // Hours Coding / Coffees Drank come from real GitHub activity — no
    // WakaTime account required. See the `hoursPerContribution` comment in
    // src/data/about-me.js for what this estimate is (and isn't).
    const hoursAreLive = githubIsLive && githubData.totalContributions != null
    const totalHours = hoursAreLive
        ? Math.round(githubData.totalContributions * aboutMe.hoursPerContribution)
        : aboutMe.fallbackHours
    const totalCoffees = Math.ceil(totalHours / 4)
    const track = spotifyData.track ?? aboutMe.fallbackTrack

    const nextScratchReveal = () => setScratchReveal((current) => pickScratchReveal(current))

    return (
        <div data-theme="dark" className="relative">
            <div className="py-12 md:py-16">
                <Container>
                    <div className="mb-10 animate-fade-up text-center">
                        <span className="mb-4 inline-block rounded-full border border-accent-secondary/30 bg-accent-secondary-soft px-3 py-1 text-xs font-medium uppercase tracking-widest text-accent-secondary">
                            Signed in
                        </span>
                        <h1 className="text-gradient-gold font-display text-4xl font-semibold md:text-5xl">
                            About me...
                        </h1>
                        <p className="mx-auto mt-3 max-w-lg text-ink-muted">
                            A little dashboard about {aboutMe.name}, since a bio paragraph felt
                            boring.
                        </p>
                    </div>

                    <ul className="about-me-grid list-none animate-fade-up">
                        <li style={{ gridArea: 'location' }}>
                            <BentoCard icon={<MapPin size={18} />} title={aboutMe.journey.label} className="h-full">
                                <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                                    <Globe fullscreen={false} />
                                </div>
                            </BentoCard>
                        </li>

                        <li style={{ gridArea: 'scratch' }}>
                            <BentoCard icon={<Hand size={18} />} title="Scratch Me" className="h-full">
                                <div className="relative flex flex-1 items-center justify-center">
                                    <ScratchToReveal
                                        width={180}
                                        height={130}
                                        minScratchPercentage={35}
                                        gradientColors={['#A97CF9', '#F38CB9', '#FDCC92']}
                                        resetKey={scratchReveal}
                                        onComplete={nextScratchReveal}
                                        className="flex items-center justify-center overflow-hidden rounded-xl bg-paper"
                                    >
                                        <span className="text-5xl">{scratchReveal}</span>
                                    </ScratchToReveal>
                                    <button
                                        type="button"
                                        onClick={nextScratchReveal}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        aria-label="Show a different scratch card"
                                        className="absolute right-1 top-1 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-accent"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </BentoCard>
                        </li>

                        <li style={{ gridArea: 'activity' }}>
                            <BentoCard
                                icon={<GithubIcon size={18} />}
                                title="Activity"
                                tooltip="Last 7 weeks"
                                className="h-full"
                            >
                                <GitHubHeatmap contributions={githubData.contributions} />
                                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
                                    <span>Less</span>
                                    <div className="flex gap-1">
                                        <div className="h-2.5 w-2.5 rounded-[2px] bg-surface" />
                                        <div className="h-2.5 w-2.5 rounded-[2px] bg-green-900/70" />
                                        <div className="h-2.5 w-2.5 rounded-[2px] bg-green-700/80" />
                                        <div className="h-2.5 w-2.5 rounded-[2px] bg-green-500/90" />
                                        <div className="h-2.5 w-2.5 rounded-[2px] bg-green-400" />
                                    </div>
                                    <span>More</span>
                                </div>
                            </BentoCard>
                        </li>

                        <li style={{ gridArea: 'coffees' }}>
                            <BentoCard
                                icon={<Coffee size={18} />}
                                title="Coffees Drank"
                                tooltip="1 coffee = 4 hours coding"
                                className="h-full"
                            >
                                <div className="flex flex-1 items-center">
                                    <NumberTicker value={totalCoffees} className="text-3xl font-semibold text-ink" />
                                </div>
                            </BentoCard>
                        </li>

                        <li style={{ gridArea: 'hours' }}>
                            <BentoCard
                                icon={<Clock size={18} />}
                                title="Hours Coding"
                                tooltip={hoursAreLive ? 'Estimated from live GitHub activity' : undefined}
                                className="h-full"
                            >
                                <div className="flex flex-1 items-center">
                                    <NumberTicker value={totalHours} className="text-3xl font-semibold text-ink" />
                                </div>
                            </BentoCard>
                        </li>

                        <li style={{ gridArea: 'music' }}>
                            <BentoCard
                                icon={<Music2 size={18} />}
                                title="Last Played"
                                tooltip={trackIsLive ? 'Live via Spotify' : undefined}
                                className="h-full"
                            >
                                <a
                                    href={track.songUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-1 items-center gap-3 overflow-hidden"
                                >
                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface">
                                        {track.albumImageUrl && (
                                            <img
                                                src={track.albumImageUrl}
                                                alt={`${track.album} cover`}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                        <Marquee pauseOnHover durationSeconds={12}>
                                            <p className="whitespace-nowrap text-sm">
                                                <span className="text-ink">{track.title}</span>
                                                <span className="text-ink-muted"> • {track.artist} • {track.album} •</span>
                                            </p>
                                        </Marquee>
                                    </div>
                                </a>
                            </BentoCard>
                        </li>

                        <li style={{ gridArea: 'favorite' }}>
                            <BentoCard icon={<Heart size={18} />} title="Fav Tool" className="h-full">
                                <div className="flex flex-1 items-center text-ink-muted">
                                    <span className="text-lg font-medium text-ink">{aboutMe.favTool}</span>
                                </div>
                            </BentoCard>
                        </li>

                        <li style={{ gridArea: 'connect' }}>
                            <BentoCard icon={<Link2 size={18} />} title="Connect" className="h-full">
                                <div className="flex flex-1 flex-col justify-center gap-3">
                                    {aboutMe.contact.map(({ label, href }) => (
                                        <a
                                            key={label}
                                            href={href}
                                            target={href.startsWith('http') ? '_blank' : undefined}
                                            rel="noreferrer"
                                            className="text-sm font-medium text-ink-muted transition-colors hover:text-accent"
                                        >
                                            {label}
                                        </a>
                                    ))}
                                </div>
                            </BentoCard>
                        </li>

                        <li style={{ gridArea: 'tools' }}>
                            <BentoCard icon={<Wrench size={18} />} title="Tools" className="h-full">
                                <Marquee pauseOnHover durationSeconds={22}>
                                    {aboutMe.tools.map((tool) => (
                                        <span
                                            key={tool}
                                            className="whitespace-nowrap rounded-full border border-border-soft bg-surface px-3 py-1 text-sm text-ink-muted"
                                        >
                                            {tool}
                                        </span>
                                    ))}
                                </Marquee>
                            </BentoCard>
                        </li>
                    </ul>
                </Container>
            </div>
        </div>
    )
}

export default AboutMe
