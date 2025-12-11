import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/LogoJaesCargo.svg';


const Home: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 relative overflow-hidden">

      <img src={logo} alt="Logo de WolfBox" className="h-32 md:h-40 lg:h-70 mx-auto" />

      <p className='text-center text-2xl mt-3 z-10'>
          'Slogan de la compania'
      </p>

      <div className='flex flex-col sm:flex-row gap-6 mt-8 z-10'>
        <button onClick={() => navigate('/login')} className='bg-red-900 text-white py-2 px-6 sm:py-3 sm:px-8 text-base sm:text-lg lg:text-xl rounded-2xl cursor-pointer shadow-md hover:bg-red-950 transition duration-300 transform hover:scale-105 hover:shadow-lg"'>
          Iniciar sesión
        </button>
        <button
        onClick={() => navigate('/register')} 
        className='bg-red-900 text-white py-2 px-6 sm:py-3 sm:px-8 text-base sm:text-lg lg:text-xl rounded-2xl cursor-pointer shadow-md hover:bg-red-950 transition duration-300 transform hover:scale-105 hover:shadow-lg'>
          Crear casillero
        </button>
      </div>

      <p className='fixed bottom-4 inset-x-0 text-center text-xs text-gray-600 z-10'>
        Copyright © Wolfbox Software 2025
      </p>

      <div className="absolute bg-red-900 rounded-full opacity-90 w-[25vw] h-[25vw] top-[-10vw] right-[-15vw]"></div>
      <div className="absolute bg-red-900 rounded-full opacity-90 w-[10vw] h-[10vw] top-[25vh] right-[10vw] hidden sm:block"></div>
      <div className="absolute bg-red-900 rounded-full opacity-90 w-[8vw] h-[8vw] top-[75vh] left-[20vw] hidden md:block"></div>
      <div className="absolute bg-red-900 rounded-full opacity-90 w-[10vw] h-[10vw] top-[50vh] left-[5vw] hidden md:block"></div>
      <div className="absolute bg-red-900 rounded-full opacity-90 w-[25vw] h-[25vw] bottom-[-15vw] left-[-10vw]"></div>
    </div>
  );
};

export default Home;
  