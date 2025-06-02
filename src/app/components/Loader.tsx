import React from "react";
import { TypeAnimation } from "react-type-animation";
// import Image from "next/image";

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-box rounded-lg mx-auto flex items-center px-4 justify-center shadow-2xl">
        {/* <Image
          src="/images/jrv_logo2.webp"
          width={150}
          height={50}
          alt="jrv_logo2"
          className="h-14 w-30 bg-black"
        /> */}
        <div className="text-2xl font-bold text-white">
          <TypeAnimation
            sequence={[
              "Anbaa",
              1200,
              "Anbaa Automobile",
              1200,
              "Anbaa Automobile Admin",
              1200,
              "",
              1000,
            ]}
            wrapper="span"
            repeat={Infinity}
            className="inline-block"
          />
        </div>
        <div className="loading-line mt-8"></div>
      </div>
    </div>
  );
};

export default Loader;
