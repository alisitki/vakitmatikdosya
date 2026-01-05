"use client";

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { FlowFieldLinesScene } from './scenes/FlowFieldLinesScene';
import { GeometricPatternScene } from './scenes/GeometricPatternScene';
import { ConstellationScene } from './scenes/ConstellationScene';
import { useReducedMotion } from '@/lib/motion';

interface BackgroundStageProps {
    scene?: 'flow' | 'pattern' | 'constellation';
    intensity?: number;
}

export function BackgroundStage({ scene = 'flow', intensity = 0.5 }: BackgroundStageProps) {
    const [mounted, setMounted] = useState(false);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const renderScene = () => {
        if (reducedMotion) return null;

        switch (scene) {
            case 'pattern':
                return <GeometricPatternScene intensity={intensity} />;
            case 'constellation':
                return <ConstellationScene intensity={intensity} />;
            case 'flow':
            default:
                return <FlowFieldLinesScene intensity={intensity} />;
        }
    };

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[var(--theme-bg)]">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)]}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    {renderScene()}
                </Suspense>
            </Canvas>
        </div>
    );
}
