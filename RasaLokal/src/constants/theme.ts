export const COLORS = { primary:'#F05A28',primary2:'#FF7A45',primaryDark:'#B93C16',orange50:'#FFF4ED',orange100:'#FFE2D1',orange200:'#FFC3A2',text:'#201A17',secondaryText:'#756C67',muted:'#A69D97',background:'#F8F6F3',card:'#FFFFFF',elevated:'#FFFCFA',border:'#EDE7E2',success:'#17815D',successSoft:'#E8F6F0',danger:'#D64545',dangerSoft:'#FDECEC',warning:'#B7791F',warningSoft:'#FFF4D8',info:'#3C6EB4',infoSoft:'#EAF1FB',ink:'#17110E',cream:'#F4EEE8',white:'#FFFFFF',black:'#0F0D0C' } as const;
export const SPACING={xxs:4,xs:8,sm:12,md:16,lg:20,xl:24,xxl:32,huge:44} as const;
export const RADIUS={xs:8,sm:12,md:16,lg:20,xl:26,pill:999} as const;
export const TYPE={display:{fontSize:32,lineHeight:36,fontWeight:'900' as const,letterSpacing:-1.2},h1:{fontSize:25,lineHeight:30,fontWeight:'900' as const,letterSpacing:-.7},h2:{fontSize:18,lineHeight:23,fontWeight:'900' as const,letterSpacing:-.35},body:{fontSize:13,lineHeight:19,fontWeight:'500' as const},caption:{fontSize:10,lineHeight:14,fontWeight:'600' as const}} as const;
export const MOTION={quick:180,normal:320,slow:520,spring:{damping:16,stiffness:180,mass:.8}} as const;
export const SHADOW={shadowColor:'#2A1710',shadowOffset:{width:0,height:6},shadowOpacity:.08,shadowRadius:18,elevation:4};
export const SOFT_SHADOW={shadowColor:'#2A1710',shadowOffset:{width:0,height:3},shadowOpacity:.045,shadowRadius:10,elevation:2};
