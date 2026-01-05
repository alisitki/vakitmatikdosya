"use client";

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function FlowFieldLinesScene({ intensity = 0.5 }) {
    const lineCount = Math.floor(40 * intensity);
    const segments = 20;

    const lines = useMemo(() => {
        return Array.from({ length: lineCount }).map(() => {
            const points = [];
            const startX = (Math.random() - 0.5) * 10;
            const startY = (Math.random() - 0.5) * 10;
            const startZ = (Math.random() - 0.5) * 10;

            for (let i = 0; i < segments; i++) {
                points.push(new THREE.Vector3(
                    startX + (Math.random() - 0.5) * 0.5,
                    startY + (Math.random() - 0.5) * 0.5,
                    startZ + (Math.random() - 0.5) * 0.5
                ));
            }
            return new THREE.CatmullRomCurve3(points);
        });
    }, [lineCount]);

    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime() * 0.1;
        groupRef.current.rotation.y = t;
        groupRef.current.rotation.z = t * 0.5;
    });

    return (
        <group ref={groupRef}>
            {lines.map((curve, i) => (
                <mesh key={i}>
                    <tubeGeometry args={[curve, segments, 0.005, 8, false]} />
                    <meshBasicMaterial
                        color="var(--theme-accent)"
                        transparent
                        opacity={0.08 + (intensity * 0.04)}
                    />
                </mesh>
            ))}
        </group>
    );
}
