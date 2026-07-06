"use client";
import React, { useEffect, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Leaf } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

const footerLinks: FooterSection[] = [
  {
    label: "Product",
    links: [
      { title: "Features", href: "#" },
      { title: "Pricing", href: "#" },
      { title: "Testimonials", href: "#" },
      { title: "Integration", href: "#" },
    ],
  },
  {
    label: "Company",
    links: [
      { title: "FAQs", href: "#" },
      { title: "About Us", href: "#" },
      { title: "Privacy Policy", href: "#" },
      { title: "Terms of Services", href: "#" },
    ],
  },
  {
    label: "Resources",
    links: [
      { title: "Blog", href: "#" },
      { title: "Changelog", href: "#" },
      { title: "Brand", href: "#" },
      { title: "Help", href: "#" },
    ],
  },
  {
    label: "Social Links",
    links: [],
  },
];

const labelTranslations: Record<string, Record<string, string>> = {
  en: {
    Product: "Product",
    Company: "Company",
    Resources: "Resources",
    "Social Links": "Social Links",
    Features: "Features",
    Pricing: "Pricing",
    Testimonials: "Testimonials",
    Integration: "Integration",
    FAQs: "FAQs",
    "About Us": "About Us",
    "Privacy Policy": "Privacy Policy",
    "Terms of Services": "Terms of Services",
    Blog: "Blog",
    Changelog: "Changelog",
    Brand: "Brand",
    Help: "Help",
  },
  hi: {
    Product: "उत्पाद",
    Company: "कंपनी",
    Resources: "संसाधन",
    "Social Links": "सामाजिक संबंध",
    Features: "विशेषताएं",
    Pricing: "मूल्य निर्धारण",
    Testimonials: "प्रशंसापत्र",
    Integration: "एकीकरण",
    FAQs: "पूछे जाने वाले प्रश्न",
    "About Us": "हमारे बारे में",
    "Privacy Policy": "गोपनीयता नीति",
    "Terms of Services": "सेवा की शर्तें",
    Blog: "ब्लॉग",
    Changelog: "बदलाव सूची",
    Brand: "ब्रांड",
    Help: "मदद",
  },
  mr: {
    Product: "उत्पादन",
    Company: "कंपनी",
    Resources: "संसाधने",
    "Social Links": "सोशल लिंक्स",
    Features: "वैशिष्ट्ये",
    Pricing: "किंमत",
    Testimonials: "प्रशंसापत्रे",
    Integration: "एकीकरण",
    FAQs: "प्रश्न",
    "About Us": "आमच्याबद्दल",
    "Privacy Policy": "गोपनीयता धोरण",
    "Terms of Services": "अटी आणि शर्ती",
    Blog: "ब्लॉग",
    Changelog: "बदलाव",
    Brand: "ब्रँड",
    Help: "मदत",
  },
  ta: {
    Product: "தயாரிப்பு",
    Company: "நிறுவனம்",
    Resources: "வளங்கள்",
    "Social Links": "சமூக இணைப்புகள்",
    Features: "அம்சங்கள்",
    Pricing: "விலை",
    Testimonials: "சான்றுகள்",
    Integration: "ஒருங்கிணைப்பு",
    FAQs: "கேள்விகள்",
    "About Us": "எங்களைப் பற்றி",
    "Privacy Policy": "தனியுரிமைக் கொள்கை",
    "Terms of Services": "சேவை விதிமுறைகள்",
    Blog: "வலைப்பதிவு",
    Changelog: "மாற்றங்கள்",
    Brand: "பிராண்ட்",
    Help: "உதவி",
  },
  gu: {
    Product: "ઉત્પાદન",
    Company: "કંપની",
    Resources: "સંસાધનો",
    "Social Links": "સોશિયલ લિંક્સ",
    Features: "વિશેષતાઓ",
    Pricing: "કિંમત",
    Testimonials: "પ્રશંસાપત્રો",
    Integration: "એકીકરણ",
    FAQs: "પ્રશ્નો",
    "About Us": "અમારા વિશે",
    "Privacy Policy": "ગોપનીયતા નીતિ",
    "Terms of Services": "સેવાની શરતો",
    Blog: "બ્લોગ",
    Changelog: "ફેરફારો",
    Brand: "બ્રાન્ડ",
    Help: "મદદ",
  },
};

export function Footer() {
  const { language, t } = useLanguage();
  const translations = labelTranslations[language] || labelTranslations.en;

  const translate = (text: string) => {
    return translations[text] || text;
  };

  const [mounted, setMounted] = useState(false);

  // This lifecycle tracker triggers ONLY after the client browser handles hydration safely
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 🚀 THE MAGIC: If not mounted yet, render a plain placeholder block
  // that matches exactly what the server sends down!
  if (!mounted) {
    return <div className="w-32 h-6 bg-transparent" />; // Invisible spacer box
  }

  return (
    <footer className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16">
      <div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <div className="flex items-center space-x-2">
            <Leaf className="size-6 text-emerald-600" />
            <span className="text-xl font-bold logoFace">{t.title}</span>
          </div>
          <p className="text-muted-foreground mt-8 text-sm md:mt-0">
            {t.landing.footerRights}
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {translate(section.label)}
                </h3>
                <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        className="hover:text-foreground inline-flex items-center transition-all duration-300"
                      >
                        {link.icon && <link.icon className="me-1 size-4" />}
                        {translate(link.title)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
export default Footer;
