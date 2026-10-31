/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutable UI-thread state. */
import type { PropsWithChildren } from 'react';
import { Pressable,type PressableProps,type StyleProp,type ViewStyle } from 'react-native';
import Animated,{FadeInDown,FadeOut,useAnimatedStyle,useSharedValue,withSpring} from 'react-native-reanimated';
import { MOTION } from '@/constants/theme';
const AnimatedPressable=Animated.createAnimatedComponent(Pressable);
export function MotionPressable({children,style,disabled,...props}:PropsWithChildren<PressableProps>){const scale=useSharedValue(1);const animated=useAnimatedStyle(()=>({transform:[{scale:scale.value}]}));return <AnimatedPressable {...props} disabled={disabled} onPressIn={e=>{scale.value=withSpring(.97,MOTION.spring);props.onPressIn?.(e)}} onPressOut={e=>{scale.value=withSpring(1,MOTION.spring);props.onPressOut?.(e)}} style={[style as StyleProp<ViewStyle>,animated,disabled&&{opacity:.5}]}>{children}</AnimatedPressable>}
export function Reveal({children,delay=0,style}:PropsWithChildren<{delay?:number;style?:StyleProp<ViewStyle>}>){return <Animated.View entering={FadeInDown.duration(MOTION.slow).delay(delay).springify().damping(18)} exiting={FadeOut.duration(MOTION.quick)} style={style}>{children}</Animated.View>}
