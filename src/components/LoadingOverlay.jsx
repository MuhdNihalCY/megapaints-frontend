import React from "react";

// Loading component styles
const loadingStyles = `
  /* From Uiverse.io by dovatgabriel */ 
    .three-body {
     --uib-size: 35px;
     --uib-speed: 0.8s;
     --uib-color: #5D3FD3;
     position: relative;
     display: inline-block;
     height: var(--uib-size);
     width: var(--uib-size);
     animation: spin78236 calc(var(--uib-speed) * 2.5) infinite linear;
    }

    .three-body__dot {
     position: absolute;
     height: 100%;
     width: 30%;
    }

    .three-body__dot:after {
     content: '';
     position: absolute;
     height: 0%;
     width: 100%;
     padding-bottom: 100%;
     background-color: var(--uib-color);
     border-radius: 50%;
    }

    .three-body__dot:nth-child(1) {
     bottom: 5%;
     left: 0;
     transform: rotate(60deg);
     transform-origin: 50% 85%;
    }

    .three-body__dot:nth-child(1)::after {
     bottom: 0;
     left: 0;
     animation: wobble1 var(--uib-speed) infinite ease-in-out;
     animation-delay: calc(var(--uib-speed) * -0.3);
    }

    .three-body__dot:nth-child(2) {
     bottom: 5%;
     right: 0;
     transform: rotate(-60deg);
     transform-origin: 50% 85%;
    }

    .three-body__dot:nth-child(2)::after {
     bottom: 0;
     left: 0;
     animation: wobble1 var(--uib-speed) infinite
        calc(var(--uib-speed) * -0.15) ease-in-out;
    }

    .three-body__dot:nth-child(3) {
     bottom: -5%;
     left: 0;
     transform: translateX(116.666%);
    }

    .three-body__dot:nth-child(3)::after {
     top: 0;
     left: 0;
     animation: wobble2 var(--uib-speed) infinite ease-in-out;
    }

    @keyframes spin78236 {
     0% {
      transform: rotate(0deg);
     }

     100% {
      transform: rotate(360deg);
     }
    }

    @keyframes wobble1 {
     0%,
      100% {
      transform: translateY(0%) scale(1);
      opacity: 1;
     }

     50% {
      transform: translateY(-66%) scale(0.65);
      opacity: 0.8;
     }
    }

    @keyframes wobble2 {
     0%,
      100% {
      transform: translateY(0%) scale(1);
      opacity: 1;
     }

     50% {
      transform: translateY(66%) scale(0.65);
      opacity: 0.8;
     }
    }

`;

// Loading Overlay Component
const LoadingOverlay = ({ isLoading, message = "Loading..." }) => {
    if (!isLoading) return null;

    return (
        <>
            <style>{loadingStyles}</style>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-3xl z-[9999] flex items-center justify-center">
                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-3xl rounded-lg p-8 shadow-xl flex flex-col items-center justify-center">
                    <div className="three-body">
                        <div className="three-body__dot"></div>
                        <div className="three-body__dot"></div>
                        <div className="three-body__dot"></div>
                    </div>
                    <div className="text-center text-gray-700 dark:text-gray-300 mt-4 font-medium">
                        {message}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoadingOverlay;
