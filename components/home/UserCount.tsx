"use client";

import * as React from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CounterProps {
  value: number;
  duration?: number;
  className?: string;
}

const AnimatedCounter: React.FC<CounterProps> = ({
  value,
  duration = 2,
  className,
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const motionValue = useMotionValue(0);

  React.useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(Math.floor(latest));
      },
    });

    return controls.stop;
  }, [value, duration, motionValue]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return <span className={className}>{formatNumber(displayValue)}</span>;
};

const avatarData = [
  { name: "Sarah", image: "https://i.pravatar.cc/150?img=1" },
  { name: "Mike", image: "https://i.pravatar.cc/150?img=3" },
  { name: "Emma", image: "https://i.pravatar.cc/150?img=5" },
  { name: "John", image: "https://i.pravatar.cc/150?img=7" },
  { name: "Lisa", image: "https://i.pravatar.cc/150?img=9" },
];

interface UserBaseCounterProps {
  totalUsers?: number;
  className?: string;
}

export const UserBaseCounter: React.FC<UserBaseCounterProps> = ({
  totalUsers = 50000,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn("text-left flex flex-col items-start", className)}
    >
      <div className="relative mb-3 flex flex-col items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-start mb-4"
        >
          <div className="flex -space-x-3">
            {avatarData.map((avatar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + i * 0.1,
                  type: "spring",
                  stiffness: 100,
                }}
              >
                <Avatar className="w-12 h-12 border-2 border-background ring-2 ring-green-500/20 hover:ring-green-500/40 transition-all hover:scale-110">
                  <AvatarImage src={avatar.image} alt={avatar.name} />
                  <AvatarFallback className="bg-linear-to-br from-green-400 to-emerald-600 text-white">
                    {avatar.name[0]}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative group inline-block text-left">
          <div className="relative bg-background backdrop-blur-lg border rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <Users className="w-7 h-7" />
              <div>
                <div className="text-3xl font-bold text-foreground flex items-center justify-center gap-1">
                  <AnimatedCounter value={totalUsers} duration={4} />
                  <span className="text-green-600">+</span>
                </div>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-white">Join thousands of satisfied users</p>
    </motion.div>
  );
};
