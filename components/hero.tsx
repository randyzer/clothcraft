"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Badge } from "./badge";
import { HeroTryOn } from "./hero-try-on";

export const Hero = () => {
  const t = useTranslations("hero");

  return (
    <section className="flex min-h-screen w-full flex-col items-center pt-20 md:pt-28">
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: "easeOut", duration: 0.45 }}
        className="flex justify-center"
      >
        <Badge>{t("badge")}</Badge>
      </motion.div>

      <motion.h1
        initial={{ y: 36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: "easeOut", duration: 0.45 }}
        className="relative z-10 mx-auto mt-6 max-w-4xl text-center text-4xl font-semibold leading-tight text-foreground md:text-6xl"
      >
        {t("title")}
      </motion.h1>

      <motion.p
        initial={{ y: 36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: "easeOut", duration: 0.45, delay: 0.15 }}
        className="relative z-10 mx-auto mt-5 max-w-3xl text-center text-base leading-7 text-muted-foreground md:text-lg"
      >
        {t("description")}
      </motion.p>

      <motion.div
        initial={{ y: 56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: "easeOut", duration: 0.45, delay: 0.25 }}
        className="relative z-10 w-full"
      >
        <HeroTryOn />
      </motion.div>
    </section>
  );
};
