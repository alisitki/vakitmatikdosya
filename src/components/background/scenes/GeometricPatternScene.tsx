"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function GeometricPatternScene({ intensity = 0.5 }) {
    const groupRef = useRef<THREE.Group>(null);

    const shapes = useMemo(() => {
        const items = [];
        const count = Math.floor(8 * intensity);
        for (let i = 0; i < count; i++) {
            items.push({
                rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
                scale: 1 + Math.random() * 2,
                speed: 0.1 + Math.random() * 0.2
            });
        }
        return items;
    }, [intensity]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.rotation.z = t * 0.05;
    });

    return (
        <group ref={groupRef}>
            {shapes.map((s, i) => (
                <mesh key={i} rotation={s.rotation as any} scale={s.scale}>
                    <octahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial
                        color="var(--theme-accent)"
                        wireframe
                        transparent
                        opacity={0.04 + (intensity * 0.04)}
                    />
                </mesh>
            ))}
        </group>
    );
}
