import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

// Devuelve la altura del teclado (0 cuando está oculto).
// Dentro de un <Modal> de Android el teclado tapa el contenido (la ventana no
// hace resize), así que se usa esta altura para levantar manualmente el sheet.
export default function useKeyboardHeight() {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(showEvt, (e) => setHeight(e?.endCoordinates?.height ?? 0))
    const hideSub = Keyboard.addListener(hideEvt, () => setHeight(0))
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  return height
}
