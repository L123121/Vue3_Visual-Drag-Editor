import { deepCopy } from '@/utils/utils'
import { useStore } from '@/store'
import { divide, multiply } from 'mathjs'

const needToChangeAttrs = ['top', 'left', 'width', 'height', 'fontSize', 'padding']
// 根据比例缩放组件尺寸  
export default function changeComponentsSizeWithScale(scale, snapshotData = null) {
    const store = useStore()
    const componentData = snapshotData || deepCopy(store.componentData)  
    componentData.forEach(component => {  
        Object.keys(component.style).forEach(key => {  
            if (needToChangeAttrs.includes(key)) {  
                let newKey  
                if (snapshotData) {  
                    // 根据比例计算新的属性值
                    newKey = ((component.style[key] / snapshotData[0].lastScale) * scale).toFixed(4) - 0 
                } else {  
                    // 否则根据当前画布的比例计算新的属性值
                    newKey = ((component.style[key] / store.canvasStyleData.scale) * scale).toFixed(4) - 0
                }  
                
                if (key == 'top' || key == 'left') {  
                    component.style[key] = newKey
                } else {  
                    component.style[key] = newKey == 0 ? 1 : newKey 
                }  
            }  
        })  
    })  
    
    if (snapshotData) {  
        return componentData  
    }  
    
    store.setComponentData(componentData) 
    // 更新后的组件数据
    store.setCurComponent({   
        component: componentData[store.curComponentIndex],   
        index: store.curComponentIndex,  
    })
  
    // 更新画布的比例  
    store.setCanvasStyle({  
        ...store.canvasStyleData,  
        scale,  
    }) 
}

const needToChangeAttrs2 = ['width', 'height', 'fontSize', 'padding']
export function changeComponentSizeWithScale(component) {
    const store = useStore()
    Object.keys(component.style).forEach(key => {
        if (needToChangeAttrs2.includes(key)) {
            if (key === 'fontSize' && component.style[key] === '') return

            component.style[key] = format(component.style[key], store.canvasStyleData.scale)
        }
    })
}

function format(value, scale) {
    return multiply(value, divide(parseFloat(scale), 100))
}
