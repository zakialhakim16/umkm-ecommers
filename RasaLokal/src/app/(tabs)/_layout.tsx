import { Redirect,Tabs } from 'expo-router';
import { View,type ColorValue } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { RequireSession } from '@/components/RequireSession';
import { COLORS,RADIUS,SHADOW } from '@/constants/theme';
import { APP_HOME,IS_CONSUMER } from '@/lib/appVariant';
function TabIcon({name,color,focused}:{name:string;color:ColorValue;focused:boolean}){return <View style={{width:38,height:29,borderRadius:RADIUS.pill,alignItems:'center',justifyContent:'center',backgroundColor:focused?COLORS.orange50:'transparent'}}><AppIcon name={name} size={21} color={String(color)}/></View>}
export default function TabLayout(){if(!IS_CONSUMER)return <Redirect href={APP_HOME as never}/>;return <RequireSession><Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:COLORS.primary,tabBarInactiveTintColor:'#928A85',tabBarHideOnKeyboard:true,tabBarStyle:{position:'absolute',height:74,marginHorizontal:12,marginBottom:10,paddingTop:7,paddingBottom:9,borderTopWidth:0,borderRadius:22,backgroundColor:'rgba(255,255,255,0.97)',...SHADOW},tabBarLabelStyle:{fontSize:9,fontWeight:'800',marginTop:1}}}>
  <Tabs.Screen name="index" options={{title:'Beranda',tabBarIcon:({color,focused})=><TabIcon name="home" color={color} focused={focused}/>}}/><Tabs.Screen name="umkm" options={{title:'Jelajah',tabBarIcon:({color,focused})=><TabIcon name="storefront" color={color} focused={focused}/>}}/><Tabs.Screen name="cart" options={{title:'Keranjang',tabBarIcon:({color,focused})=><TabIcon name="cart" color={color} focused={focused}/>}}/><Tabs.Screen name="orders" options={{title:'Pesanan',tabBarIcon:({color,focused})=><TabIcon name="receipt" color={color} focused={focused}/>}}/><Tabs.Screen name="profile" options={{title:'Akun',tabBarIcon:({color,focused})=><TabIcon name="person" color={color} focused={focused}/>}}/>
</Tabs></RequireSession>}
