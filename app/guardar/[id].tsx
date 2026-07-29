import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCollection, getCollections, getSavedPatioMeta, saveSavedPatioMeta, togglePatioInCollection, type PatioCollection, type SavedPatioMeta } from '@/lib/collections';
import { useTheme } from '@/lib/theme';

export default function SavePlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patioId = String(id);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  const [meta, setMeta] = useState<SavedPatioMeta>({ patioId });
  const [newTitle, setNewTitle] = useState('');
  const load = useCallback(() => Promise.all([getCollections(), getSavedPatioMeta(patioId)]).then(([c, m]) => { setCollections(c); setMeta(m); }), [patioId]);
  useEffect(() => { load().catch(() => {}); }, [load]);
  const updateMeta = async (patch: Partial<SavedPatioMeta>) => {
    const next = { ...meta, ...patch }; setMeta(next); await saveSavedPatioMeta(next);
  };
  const create = async () => {
    if (!newTitle.trim()) return;
    const c = await createCollection(newTitle);
    await togglePatioInCollection(c.id, patioId);
    setNewTitle(''); await load(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };
  return <View style={[s.root,{backgroundColor:theme.bg,paddingTop:insets.top}]}>
    <Stack.Screen options={{headerShown:false}}/>
    <View style={s.nav}><TouchableOpacity onPress={()=>router.back()}><Ionicons name="chevron-back" size={22} color={theme.text}/></TouchableOpacity><Text style={[s.navTitle,{color:theme.text}]}>Organizar</Text><TouchableOpacity onPress={()=>router.back()}><Text style={[s.done,{color:theme.accent}]}>Listo</Text></TouchableOpacity></View>
    <ScrollView contentContainerStyle={{paddingBottom:40}}>
      <Text style={[s.label,{color:theme.textSecondary}]}>ESTADO</Text>
      <View style={s.chips}>{(['want_to_go','visited'] as const).map((key)=><TouchableOpacity key={key} onPress={()=>updateMeta({status:meta.status===key?undefined:key})} style={[s.chip,{borderColor:meta.status===key?theme.accent:theme.border,backgroundColor:meta.status===key?theme.accentSoft:theme.surface}]}><Text style={{color:meta.status===key?theme.accent:theme.text}}>{key==='want_to_go'?'Quiero ir':'Ya fui'}</Text></TouchableOpacity>)}</View>
      <Text style={[s.label,{color:theme.textSecondary}]}>NOTA PRIVADA</Text>
      <TextInput multiline maxLength={300} value={meta.note??''} onChangeText={(note)=>updateMeta({note})} placeholder="Algo que quieras recordar…" placeholderTextColor={theme.textMute} style={[s.note,{color:theme.text,backgroundColor:theme.surface,borderColor:theme.border}]}/>
      <Text style={[s.label,{color:theme.textSecondary}]}>CALIFICACIÓN PERSONAL</Text>
      <View style={s.chips}>{[1,2,3,4,5].map((value)=><TouchableOpacity key={value} onPress={()=>updateMeta({rating:meta.rating===value?undefined:value})}><Ionicons name={value<=(meta.rating??0)?'star':'star-outline'} size={24} color={value<=(meta.rating??0)?theme.accent:theme.textMute}/></TouchableOpacity>)}</View>
      <Text style={[s.label,{color:theme.textSecondary}]}>COLECCIONES</Text>
      {collections.map((c)=>{const on=c.patioIds.includes(patioId);return <TouchableOpacity key={c.id} style={[s.row,{borderColor:theme.border}]} onPress={async()=>{await togglePatioInCollection(c.id,patioId);await load();Haptics.selectionAsync().catch(()=>{});}}><Text style={[s.rowText,{color:theme.text}]}>{c.title}</Text><Ionicons name={on?'checkmark-circle':'ellipse-outline'} size={22} color={on?theme.accent:theme.textMute}/></TouchableOpacity>})}
      <View style={[s.newRow,{borderColor:theme.border}]}><TextInput value={newTitle} onChangeText={setNewTitle} placeholder="Nueva colección" placeholderTextColor={theme.textMute} style={[s.newInput,{color:theme.text}]} onSubmitEditing={create}/><TouchableOpacity onPress={create}><Ionicons name="add-circle" size={24} color={newTitle.trim()?theme.accent:theme.textMute}/></TouchableOpacity></View>
    </ScrollView>
  </View>;
}
const s=StyleSheet.create({root:{flex:1,paddingHorizontal:20},nav:{height:56,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},navTitle:{fontSize:17,fontWeight:'700'},done:{fontSize:16,fontWeight:'700'},label:{fontSize:11,fontWeight:'700',letterSpacing:1.2,marginTop:24,marginBottom:10},chips:{flexDirection:'row',gap:8},chip:{height:38,borderRadius:19,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:15,justifyContent:'center'},note:{minHeight:94,borderRadius:16,borderWidth:StyleSheet.hairlineWidth,padding:14,fontSize:14,textAlignVertical:'top'},row:{height:54,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center'},rowText:{flex:1,fontSize:16,fontWeight:'600'},newRow:{height:54,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center'},newInput:{flex:1,fontSize:16},});
