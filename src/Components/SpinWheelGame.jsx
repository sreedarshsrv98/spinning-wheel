// app/components/SpinWheelGame.js

"use client";

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation'; 
// 1. IMPORT STYLES
import styles from '@/styles/customstyle.scss';
import SpinnerWheel from './SpinnerWheel';

// Include Bootstrap CSS via CDN for basic styling and responsiveness
const BootstrapCSS = () => (
    <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
        crossOrigin="anonymous" 
    />
);

// --- CONSTANTS ---
const PRIZE_SEGMENTS = [
    { label: "Frying Pan", icon: '🍳', color: "#FF6347" },
    { label: "Better Luck Next Time", icon: '❌', color: "#2F4F4F" },
    { label: "Pressure Cooker", icon: '🍲', color: "#1E90FF" },
    { label: "Better Luck Next Time", icon: '❌', color: "#2F4F4F" },
    { label: "Sandwich Maker", icon: '🥪', color: "#DA70D6" },
    { label: "Better Luck Next Time", icon: '❌', color: "#2F4F4F" },
    { label: "Dinner Plate Set", icon: '🍽️', color: "#FFD700" },
    { label: "Better Luck Next Time", icon: '❌', color: "#2F4F4F" },
];

const NUM_SEGMENTS = PRIZE_SEGMENTS.length;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;
const POINTER_OFFSET = 90;

// --- HELPER FUNCTION: CANVAS DRAWING ---
const drawWheel = (ctx, canvasRef) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const size = canvas.width;
    const center = size / 2;
    const radius = center * 0.9;

    ctx.clearRect(0, 0, size, size);

    PRIZE_SEGMENTS.forEach((segment, index) => {
        const startAngle = index * SEGMENT_ANGLE - POINTER_OFFSET;
        const endAngle = (index + 1) * SEGMENT_ANGLE - POINTER_OFFSET;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        // Draw the segment
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startRad, endRad);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();

        // Draw text (label) and icon
        ctx.save();
        ctx.translate(center, center);
        const textAngle = startRad + (SEGMENT_ANGLE / 2) * (Math.PI / 180);
        ctx.rotate(textAngle);

        // Text Label
        ctx.fillStyle = (segment.color === "#FFD700" || segment.color === "#FF6347") ? "#2B083B" : "white";
        ctx.font = 'bold 12px Inter, sans-serif'; 
        ctx.textAlign = 'right';
        ctx.fillText(segment.label, radius * 0.8, 5);
        
        // Icon (Emoji)
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(segment.icon, radius * 0.8, -10);

        ctx.restore();
    });

    // Draw central hub
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.2, 0, 2 * Math.PI);
    ctx.fillStyle = '#C0C0C0';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();

    // Draw outer rim
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();
};


// --- TONE.JS SOUND LOGIC ---
const useTone = () => {
    const spinSynthRef = useRef(null);
    const winSynthRef = useRef(null);

    const startSpinSound = async () => {
        if (typeof window.Tone === 'undefined') { return; }
        await window.Tone.start();
        
        if (!spinSynthRef.current) {
            const noise = new window.Tone.Noise("white").toDestination();
            const autoFilter = new window.Tone.AutoFilter({
                frequency: "8n", depth: 1, baseFrequency: 2000, octaves: 2
            }).toDestination().start();
            noise.connect(autoFilter);
            noise.volume.value = -10;
            noise.start();
            spinSynthRef.current = noise; 
        }
    };

    const stopSpinSound = () => {
        if (spinSynthRef.current) {
            spinSynthRef.current.stop();
            spinSynthRef.current.dispose();
            spinSynthRef.current = null;
        }
    };

    const playWinSound = async () => {
        if (typeof window.Tone === 'undefined') return;
        await window.Tone.start();
        const synth = new window.Tone.MembraneSynth().toDestination();
        winSynthRef.current = synth;
        synth.triggerAttackRelease("C5", "8n");
        synth.triggerAttackRelease("G5", "8n", "+0.2");
        synth.triggerAttackRelease("C6", "4n", "+0.4");
        setTimeout(() => {
            synth.dispose();
            winSynthRef.current = null;
        }, 1000);
    };

    return { startSpinSound, stopSpinSound, playWinSound };
};


// --- MAIN APP COMPONENT ---
export default function SpinWheelGame() {

const pathname = usePathname(); // <-- 2. GET CURRENT PATH

    // Determine if the user is on the 'Sunitha' path (e.g., /sunitha)
    const isSunithaPage = pathname.includes('/sunitha');
    
    // Check for other defined paths
    const isLiveblePage = pathname.includes('/liveble');
    // ... other page checks (e.g., isSglePage)

    // 3. Define the background image URL based on the path
    let backgroundImageURL = '';

    if (isSunithaPage) {
        // Use the new background image for the 'Sunitha' page
        backgroundImageURL = '/sunitha-bg.png';
    } else if (isLiveblePage) {
        // Use the original background image for the 'Liveble' page
        backgroundImageURL = '/bg-img.png'; 
    } else {
        // Fallback or default background image
        backgroundImageURL = '/default-bg.png';
    }

    const [currentView, setCurrentView] = useState('register');
    const [userData, setUserData] = useState({
        name: '', mobile: '', city: '', registrationId: '', prize: null, code: null,
    });
    const [formData, setFormData] = useState({ name: '', mobile: '', city: '' });
    const [wheelRotation, setWheelRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const canvasRef = useRef(null);
    const { startSpinSound, stopSpinSound, playWinSound } = useTone();

    // Set initial Reg ID
    useEffect(() => {
        const newRegistrationId = '#' + Math.floor(1000000 + Math.random() * 9000000);
        setUserData(prev => ({ ...prev, registrationId: newRegistrationId }));
    }, []);

    // Redraw the canvas
    useEffect(() => {
        if (currentView === 'spin' && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const container = canvasRef.current.parentElement;
            
            // Responsive Canvas size
            const size = Math.min(container.offsetWidth, container.offsetHeight, 350); 
            canvasRef.current.width = size;
            canvasRef.current.height = size;
            
            drawWheel(ctx, canvasRef, wheelRotation);
        }
        return () => { if (isSpinning) { stopSpinSound(); } };
    }, [currentView, wheelRotation, isSpinning, stopSpinSound]);

// --- EXISTING useEffect FOR CANVAS REDRAW ---
useEffect(() => {
    // 1. Logic for drawing the canvas on 'spin' view (KEEP THIS)
    if (currentView === 'spin' && canvasRef.current) {
        // ... (Canvas drawing logic) ...
        const ctx = canvasRef.current.getContext('2d');
        const container = canvasRef.current.parentElement;
        const size = Math.min(container.offsetWidth, container.offsetHeight, 350); 
        canvasRef.current.width = size;
        canvasRef.current.height = size;
        drawWheel(ctx, canvasRef, wheelRotation);
    }
    
    // 2. NEW LOGIC TO TRIGGER SOUND ON 'reward' VIEW
    if (currentView === 'reward' && userData.prize && userData.prize.label !== "Better Luck Next Time") {
        // This ensures the sound is triggered once the reward screen is rendered
        // and all necessary scripts are loaded.
        playWinSound(); 
    }

    // Cleanup for spinning sound (KEEP THIS)
    return () => { if (isSpinning) { stopSpinSound(); } };
// Added userData.prize to the dependency array to ensure it runs after the prize is set
}, [currentView, wheelRotation, isSpinning, stopSpinSound, playWinSound, userData.prize]); // <-- UPDATED DEPENDENCY ARRAY
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegistration = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.mobile || !formData.city) {
            console.error("Please fill all fields.");
            return;
        }
        setUserData(prev => ({ ...prev, ...formData, code: 'AD' + Math.floor(1000 + Math.random() * 9000) }));
        setCurrentView('spin');
    };

    const handleSpin = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        startSpinSound();

        // Spin logic (25% chance of winning)
        const prizeSegments = PRIZE_SEGMENTS.filter(p => p.label !== "Better Luck Next Time");
        const nonPrizeSegments = PRIZE_SEGMENTS.filter(p => p.label === "Better Luck Next Time");

        let winningPrize;
        let winningIndex;

        if (Math.random() < 0.25) { // 25% chance to win an actual prize
            winningPrize = prizeSegments[Math.floor(Math.random() * prizeSegments.length)];
            winningIndex = PRIZE_SEGMENTS.findIndex(p => p.label === winningPrize.label);
        } else { // 75% chance to lose
            winningPrize = nonPrizeSegments[Math.floor(Math.random() * nonPrizeSegments.length)];
            const possibleIndices = PRIZE_SEGMENTS.map((p, i) => (p.label === winningPrize.label ? i : -1)).filter(i => i !== -1);
            winningIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
        }
        
        const targetSegmentCenterAngle = (winningIndex * SEGMENT_ANGLE) + (SEGMENT_ANGLE / 2);
        const totalSpinDegrees = (5 * 360) + (360 - targetSegmentCenterAngle);

        setWheelRotation(totalSpinDegrees);

        setTimeout(() => {
            setIsSpinning(false);
            stopSpinSound();

            if (winningPrize.label !== "Better Luck Next Time") {
                playWinSound();
            }
            
            setUserData(prev => ({
                ...prev,
                prize: winningPrize,
                code: (winningPrize.label === "Better Luck Next Time" ? null : prev.code), 
            }));
            setCurrentView('reward');
            setWheelRotation(0);
        }, 5000);
    };
    
    // Screen 1: Registration Form
    const renderRegister = () => (
        // 2. USE STYLES CLASS NAMES
        <div className={`p-4 p-sm-5 d-flex flex-column content-card`}>
            <h2 className={`text-center mb-4 form-title-custom`}>Enter Your Details</h2>
            <form onSubmit={handleRegistration} className="space-y-4">
                
                {/* Name Input */}
                <div className="mb-3">
                    <label htmlFor="name" className="label">Your Name</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        placeholder="Enter Your Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`form-control styles glass-input`}
                        required
                    />
                </div>

                {/* Mobile Input */}
                <div className="mb-3">
                    <label htmlFor="mobile" className="label">Mobile Number</label>
                    <input
                        id="mobile"
                        type="tel"
                        name="mobile"
                        placeholder="Enter Mobile Number"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className={`form-control glass-input`}
                        required
                    />
                </div>

                {/* City Input */}
                <div className="mb-4">
                    <label htmlFor="city" className="label">City</label>
                    <input
                        id="city"
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`form-control glass-input`}
                        required
                    />
                </div>
                <div className="d-flex justify-content-center">
                    <button
                        type="submit"
                        className="btn-submit-custom"
                    >
                        Submit
                    </button>
                </div>
            
            </form>
        </div>
    );

    // Screen 3: The Spinning Wheel
    const renderSpin = () => (
        <div className=" p-4 p-sm-5 d-flex flex-column align-items-center text-center">
            <div 
                className={`wheel-container position-relative mb-5`}
                style={{ width: '300px', height: '300px', maxWidth: '100%' }}
            >
                
                {/* The Wheel Pointer (Fixed Position) */}
                <div className="wheel-pointer" />
                
                {/* The Spinning Wheel Canvas container */}
                <div
                    className={`wheel-spin-area ${isSpinning ? "spinning" : ''}`}
                    style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        pointerEvents: isSpinning ? 'none' : 'auto'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="w-100 h-100 rounded-circle"
                    />
                </div>
            </div>
             <div className="d-flex justify-content-center">
                <button
                     onClick={handleSpin}
                disabled={isSpinning}
                        type="submit"
                        className={` btn-spin-custom ${isSpinning ? "disabled-spin" : ''}`}
                    >
                  {isSpinning ? 'SPINNING...' : 'Spin'}
                    </button>
                </div>
            {/* <button
                onClick={handleSpin}
                disabled={isSpinning}
                className={`btn btn-lg w-100  btn-spin-custom shadow-lg ${isSpinning ? "disabled-spin" : ''}`}
            >
                {isSpinning ? 'SPINNING...' : 'Spin'}
            </button> */}

        </div>
    );

   


const renderReward = () => (
    // Outer container for the pop-up/modal screen.
    <div 
        className="d-flex align-items-center justify-content-center" 
        style={{
            position: 'fixed', 
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050, 
            // NOTE: No background overlay requested
        }}
    >
        {/* ENHANCED Animated Content Wrapper */}
        <div 
            className="reward-popup-animation-wrapper"
            style={{
                animation: 'pop-in-reward 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                opacity: 0, 
                // Added position: relative to allow absolute positioning of the SVG content later
                position: 'relative', 
            }}
        >
            {/* 1. SVG Image/Decoration (Positioned Behind the Card) */}
            {/* The SVG should be absolutely positioned relative to the .reward-popup-animation-wrapper */}
            {/* You will need to replace the <svg> block below with your actual SVG code for the gifts and banner. */}
            <div 
                className="reward-svg-decoration"
                style={{
                    position: 'absolute',
                    top: '-400px', // Adjust this value to move the image up/down
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1, // Set lower than the main card (zIndex: 2 recommended for the card)
                    // The width and height should match your SVG's viewBox or desired size.
                    // width: '350px', 
                    // height: '200px',
                    pointerEvents: 'none', // Important: Ensures the decoration doesn't block clicks/taps
                }}
            >
                {/* ⚠️ REPLACE THIS WITH YOUR ACTUAL SVG CODE ⚠️ */}
           <img src="/reward-bg.svg" alt="" />
            </div>


            {/* The original content starts here (Z-Index should be higher than SVG) */}
            <div className="d-flex flex-column align-items-center justify-content-start h-100 p-3 reward-screen-container" style={{ zIndex: 2, position: 'relative' }}>
                
                {/* Frosted Glass Content Card (The actual visible pop-up content) */}
                <div 
                    className={`reward-content-card content-card p-4 p-sm-5 text-center`} 
                    style={{
                        // ⭐️ Ensure this card has a higher zIndex than the SVG decoration or is positioned correctly
                        zIndex: 2, 
                        position: 'relative',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.22)', 
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                        maxWidth: '355px',
                        width: '100%',
                        height: 'auto',
                    }}
                >
                    
                    {/* 2. Prize Text */}
                    <div className="win-message-text">
                        You won<br />10% Cashback
                    </div>

                    {/* 3. Registration ID & Name Block */}
                    <hr className='hr-absolute-line'/>
                    <div className="text-white text-start mb-3">
                        <div className="d-flex justify-content-between mb-1 small mb-3">
                            <span className="detail-label-text">Registration ID:</span>
                            <span className="detail-label-text">{userData.registrationId || "#122878999"}</span>
                        </div>
                        <div className="d-flex justify-content-between small mb-3">
                            <span className="detail-label-text">Name:</span>
                            <span className="detail-label-text">{userData.name || "Darsh Bhavsar"}</span>
                        </div>
                    </div>

                    {/* 4. Code Input */}
                    <div className="mb-4">
                        <input 
                            type="text" 
                            value={userData.code || "AD456J"} 
                            readOnly 
                            className={`form-control text-center reward-code-input`} 
                            style={{ height: '56px' }}
                        />
                    </div>
                    
                    {/* 5. Screenshot Instruction */}
                    <p className="detail-label-text">
                        Take a screenshot to save your code
                    </p>

                </div>
            </div>
        </div>
    </div>
);
useEffect(() => {
    // 1. Logic for drawing the canvas on 'spin' view (KEEP THIS)
    if (currentView === 'spin' && canvasRef.current) {
        // ... (Canvas drawing logic) ...
        const ctx = canvasRef.current.getContext('2d');
        const container = canvasRef.current.parentElement;
        const size = Math.min(container.offsetWidth, container.offsetHeight, 350); 
        canvasRef.current.width = size;
        canvasRef.current.height = size;
        drawWheel(ctx, canvasRef, wheelRotation);
    }
    
    // 2. NEW LOGIC TO TRIGGER SOUND ON 'reward' VIEW
    if (currentView === 'reward' && userData.prize && userData.prize.label !== "Better Luck Next Time") {
        // This ensures the sound is triggered once the reward screen is rendered
        // and all necessary scripts are loaded.
        playWinSound(); 
    }

    // Cleanup for spinning sound (KEEP THIS)
    return () => { if (isSpinning) { stopSpinSound(); } };
// Added userData.prize to the dependency array to ensure it runs after the prize is set
}, [currentView, wheelRotation, isSpinning, stopSpinSound, playWinSound, userData.prize]); // <-- UPDATED DEPENDENCY ARRAY
    // --- MAIN RENDER LOGIC ---
    const renderView = () => {
        switch (currentView) {
            case 'spin':
                // return renderSpin();
                return <SpinnerWheel/>;
            case 'reward':
                return renderReward();
            case 'register':
            default:
                return renderRegister();
        }
    };

    return (
        <>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js"></script> 
            <BootstrapCSS />
            
            <div className="app-container" style={{ backgroundImage: `url(${backgroundImageURL})` }}>
                {/* Top Centered Logo */}
                <div className="logo-wrapper">
                    <img 
                        src="/liveble-logo.svg" 
                        alt="Logolpsum" 
                        className="logo-img" 
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/120x40/ffffff/000000?text=LOGO' }}
                    />
                </div>

                <div className="main-card">
                    {renderView()}
                </div>
                {currentView !== "spin" && (
                    <img src="/bottom-img.svg" className="bottom-decoration" alt="" />
                )}
            </div>
        </>
    );
}