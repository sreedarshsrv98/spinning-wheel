import { useState, useRef, useEffect } from 'react';
import "./spinnerstyle.css"
const SpinnerWheel = () => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedPrize, setSelectedPrize] = useState(null);
    const wheelRef = useRef(null);
    const [rotation, setRotation] = useState(0);
    const spinSoundRef = useRef(null);
    const winSoundRef = useRef(null);

    useEffect(() => {
        spinSoundRef.current = new Audio('/spin-sound.mp3');
        winSoundRef.current = new Audio('/win-sound.mp3');
    }, []);

    const prizes = [
        { id: 1, label: '100 Points', color: '#F7B733', probability: 5 },
        { id: 2, label: '50 Points', color: '#ED213A', probability: 10 },
        { id: 3, label: '25 Points', color: '#6E45E2', probability: 15 },
        { id: 4, label: '10 Points', color: '#753A88', probability: 20 },
        { id: 5, label: '5 Points', color: '#F7B733', probability: 25 },
        { id: 6, label: 'Try Again', color: '#93291E', probability: 15 },
        { id: 7, label: 'Bonus Spin', color: '#88D3CE', probability: 5 },
        { id: 8, label: '1 Point', color: '#753A88', probability: 5 }
    ];

    const selectPrizeByProbability = () => {
        const random = Math.random() * 100;
        let cumulativeProbability = 0;

        for (let i = 0; i < prizes.length; i++) {
            cumulativeProbability += prizes[i].probability;
            if (random <= cumulativeProbability) {
                return i;
            }
        }
        return 0;
    };

    const spinWheel = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setSelectedPrize(null);

        if (spinSoundRef.current) {
            spinSoundRef.current.currentTime = 0;
            spinSoundRef.current.play().catch(() => { });
        }

        const selectedIndex = selectPrizeByProbability();
        const segmentAngle = 360 / prizes.length;
        const targetAngle = 360 - (selectedIndex * segmentAngle + segmentAngle / 2);
        const spins = 5;
        const totalRotation = rotation + (spins * 360) + targetAngle;

        setRotation(totalRotation);

        setTimeout(() => {
            setIsSpinning(false);
            setSelectedPrize(prizes[selectedIndex]);
            if (winSoundRef.current) {
                winSoundRef.current.currentTime = 0;
                winSoundRef.current.play().catch(() => { });
            }
        }, 9000);
    };

    const resetWheel = () => {
        setRotation(0);
        setSelectedPrize(null);
    };

    return (
        <>
            <div className="wheel-wrapper">
                <div className="wheel-pointer"></div>

                <div
                    ref={wheelRef}
                    className="wheel"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isSpinning ? 'transform 9s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                    }}
                >
                    {prizes.map((prize, index) => {
                        const segmentAngle = 360 / prizes.length;
                        const rotation = index * segmentAngle;

                        return (
                            <div
                                key={prize.id}
                                className="wheel-segment"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    backgroundColor: prize.color
                                }}
                            >
                                <div className="segment-content">
                                    <span className="prize-text">{prize.label}</span>
                                    <span className="prize-probability">{prize.probability}</span>
                                </div>
                            </div>
                        );
                    })}
                    <div className="wheel-center">
                        <span>SPIN</span>
                    </div>
                </div>
            </div>
            {/* <div className="controls">
        <button
          className="btn btn-primary btn-lg spin-button"
          onClick={spinWheel}
          disabled={isSpinning}
        >
          {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
        </button>

        {selectedPrize && (
          <button
            className="btn btn-secondary btn-lg reset-button"
            onClick={resetWheel}
          >
            Reset
          </button>
        )}
      </div> */}

            {/* {selectedPrize && (
        <div className="result-modal">
          <div className="result-content">
            <h2>Congratulations!</h2>
            <div className="prize-display">
              <div
                className="prize-icon"
                style={{ backgroundColor: selectedPrize.color }}
              >
                🎉
              </div>
              <h3>{selectedPrize.label}</h3>
              <p>You won {selectedPrize.label}!</p>
            </div>
          </div>
        </div>
      )} */}

        </>


    );
};

export default SpinnerWheel;
