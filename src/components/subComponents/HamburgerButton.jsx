const HambugerButton = (clickAction) => {
    return (
        <button
            onClick={clickAction}
            className="ml-4 md:flex flex-col items-center justify-center w-10 h-10 bg-white/5 p-1.5 rounded-xl backdrop-blur-md shadow-md transition-all duration-200 ease-in-out"
        >
            <span className="block w-6 h-0.5 bg-white mb-1"></span>
            <span className="block w-6 h-0.5 bg-white mb-1"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
        </button>
    );
};

export default HambugerButton;