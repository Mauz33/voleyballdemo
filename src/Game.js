// src/Game.js
import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const Game = () => {
    const scene = useRef(null); // ссылка на DOM-элемент для рендеринга
    const engineRef = useRef(null); // ссылка на движок Matter.js
    const renderRef = useRef(null); // ссылка на рендерер Matter.js
    const playerRef = useRef(null);
    const ballRef = useRef(null)
    const canJump = useRef(true); // Переменная для контроля прыжко

    useEffect(() => {
        // Создание движка и рендера
        const engine = Matter.Engine.create();
        engineRef.current = engine;

        const render = Matter.Render.create({
            element: scene.current,
            engine: engine,
            options: {
                showPerformance: {

                },
                width: 1600,
                height: 600,
                wireframes: false,
            },
        });
        renderRef.current = render;

        const wallOptions = { isStatic: true, restitution: 1.0, friction: 0 };
        const walls = [
            Matter.Bodies.rectangle(400, 0, 1600, 50, wallOptions), // верхняя стена
            Matter.Bodies.rectangle(400, 600, 1600, 50, wallOptions), // нижняя стена
            Matter.Bodies.rectangle(0, 300, 50, 600, wallOptions), // левая стена
            Matter.Bodies.rectangle(1600, 300, 50, 600, wallOptions) // правая стена
        ];

        // Создание тел
        const player = Matter.Bodies.circle(300, 200, 40, {
            density: 0.0005,
            inertia: Infinity,
            restitution: 0.5,
            frictionAir: 0.05,
        });
        playerRef.current = player;

        const ball = Matter.Bodies.circle(450, 50, 20, {
            restitution: 0.8,
            density: 0.0004
        });
        ballRef.current = ball;

        const ground = walls[1]

        // Создание границ канваса


        Matter.Composite.add(engine.world, [player, ball, ground, ...walls]);

        // Запуск движка и рендера
        Matter.Engine.run(engine);
        Matter.Render.run(render);

        // Создание и запуск бегуна
        const runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        // Обработчики клавиш
        const codes = {
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        };

        // Обработчики клавиш
        const handleKeyDown = (event) => {
            if (event.code in codes) {
                codes[event.code] = true;
            }

            if (event.code === 'Space' && canJump.current) {
                const groundContacts = Matter.Query.collides(player, [ground]);
                if (groundContacts.length > 0) {
                    canJump.current = false;
                    Matter.Body.applyForce(player, { x: player.position.x, y: player.position.y }, { x: 0, y: -0.1 });
                }
            }
        };

        const handleKeyUp = (event) => {
            if (event.code in codes) {
                codes[event.code] = false;
            }

            if (event.code === 'Space') {
                canJump.current = true; // Разрешаем следующий прыжок после отпускания пробела
            }

            // Остановка игрока при отпускании клавиш движения
            if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                Matter.Body.setVelocity(player, { x: 0, y: player.velocity.y });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const update = () => {
            const maxSpeed = 5;
            const groundForceMagnitude = 0.01;
            const airForceMagnitude = 0.02;

            const onGround = Matter.Query.collides(player, [walls[1]]).length > 0;

            if (codes.ArrowLeft) {
                const forceMagnitude = onGround ? groundForceMagnitude : airForceMagnitude;
                if (player.velocity.x > -maxSpeed) {
                    Matter.Body.applyForce(player, { x: player.position.x, y: player.position.y }, { x: -forceMagnitude, y: 0 });
                }
            }

            if (codes.ArrowRight) {
                const forceMagnitude = onGround ? groundForceMagnitude : airForceMagnitude;
                if (player.velocity.x < maxSpeed) {
                    Matter.Body.applyForce(player, { x: player.position.x, y: player.position.y }, { x: forceMagnitude, y: 0 });
                }
            }

            requestAnimationFrame(update);
        };

        update();


        // Очистка ресурсов при размонтировании компонента
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
            Matter.Engine.clear(engine);
            render.canvas.remove();
            render.textures = {};
        };
    }, []);

    return <div ref={scene} />;
};

export default Game;
