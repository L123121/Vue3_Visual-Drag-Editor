import { calculateRotatedPointCoordinate, getCenterPoint } from './translate'
import type { ComponentStyle } from '@/types'

/**
 * 点坐标接口
 */
interface Point {
  x: number
  y: number
}

/**
 * 控制点信息
 */
interface PointInfo {
  symmetricPoint: Point
  curPoint: Point
}

/**
 * 控制点名称类型
 */
type PointName = 'lt' | 't' | 'rt' | 'r' | 'rb' | 'b' | 'lb' | 'l'

/**
 * 计算函数类型
 */
type CalculateFunction = (
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
) => void

/**
 * 计算左上角拖动后的样式
 */
function calculateLeftTop(
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let newCenterPoint = getCenterPoint(curPosition, symmetricPoint)
  let newTopLeftPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -(style.rotate ?? 0))
  let newBottomRightPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -(style.rotate ?? 0))

  let newWidth = newBottomRightPoint.x - newTopLeftPoint.x
  let newHeight = newBottomRightPoint.y - newTopLeftPoint.y

  if (needLockProportion) {
    if (newWidth / newHeight > proportion) {
      newTopLeftPoint.x += Math.abs(newWidth - newHeight * proportion)
      newWidth = newHeight * proportion
    } else {
      newTopLeftPoint.y += Math.abs(newHeight - newWidth / proportion)
      newHeight = newWidth / proportion
    }

    const rotatedTopLeftPoint = calculateRotatedPointCoordinate(newTopLeftPoint, newCenterPoint, style.rotate ?? 0)
    newCenterPoint = getCenterPoint(rotatedTopLeftPoint, symmetricPoint)
    newTopLeftPoint = calculateRotatedPointCoordinate(rotatedTopLeftPoint, newCenterPoint, -(style.rotate ?? 0))
    newBottomRightPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -(style.rotate ?? 0))

    newWidth = newBottomRightPoint.x - newTopLeftPoint.x
    newHeight = newBottomRightPoint.y - newTopLeftPoint.y
  }

  if (newWidth > 0 && newHeight > 0) {
    style.width = Math.round(newWidth)
    style.height = Math.round(newHeight)
    style.left = Math.round(newTopLeftPoint.x)
    style.top = Math.round(newTopLeftPoint.y)
  }
}

/**
 * 计算右上角拖动后的样式
 */
function calculateRightTop(
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let newCenterPoint = getCenterPoint(curPosition, symmetricPoint)
  let newTopRightPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -(style.rotate ?? 0))
  let newBottomLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -(style.rotate ?? 0))

  let newWidth = newTopRightPoint.x - newBottomLeftPoint.x
  let newHeight = newBottomLeftPoint.y - newTopRightPoint.y

  if (needLockProportion) {
    if (newWidth / newHeight > proportion) {
      newTopRightPoint.x -= Math.abs(newWidth - newHeight * proportion)
      newWidth = newHeight * proportion
    } else {
      newTopRightPoint.y += Math.abs(newHeight - newWidth / proportion)
      newHeight = newWidth / proportion
    }

    const rotatedTopRightPoint = calculateRotatedPointCoordinate(newTopRightPoint, newCenterPoint, style.rotate ?? 0)
    newCenterPoint = getCenterPoint(rotatedTopRightPoint, symmetricPoint)
    newTopRightPoint = calculateRotatedPointCoordinate(rotatedTopRightPoint, newCenterPoint, -(style.rotate ?? 0))
    newBottomLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -(style.rotate ?? 0))

    newWidth = newTopRightPoint.x - newBottomLeftPoint.x
    newHeight = newBottomLeftPoint.y - newTopRightPoint.y
  }

  if (newWidth > 0 && newHeight > 0) {
    style.width = Math.round(newWidth)
    style.height = Math.round(newHeight)
    style.left = Math.round(newBottomLeftPoint.x)
    style.top = Math.round(newTopRightPoint.y)
  }
}

/**
 * 计算右下角拖动后的样式
 */
function calculateRightBottom(
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let newCenterPoint = getCenterPoint(curPosition, symmetricPoint)
  let newTopLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -(style.rotate ?? 0))
  let newBottomRightPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -(style.rotate ?? 0))

  let newWidth = newBottomRightPoint.x - newTopLeftPoint.x
  let newHeight = newBottomRightPoint.y - newTopLeftPoint.y

  if (needLockProportion) {
    if (newWidth / newHeight > proportion) {
      newBottomRightPoint.x -= Math.abs(newWidth - newHeight * proportion)
      newWidth = newHeight * proportion
    } else {
      newBottomRightPoint.y -= Math.abs(newHeight - newWidth / proportion)
      newHeight = newWidth / proportion
    }

    const rotatedBottomRightPoint = calculateRotatedPointCoordinate(newBottomRightPoint, newCenterPoint, style.rotate ?? 0)
    newCenterPoint = getCenterPoint(rotatedBottomRightPoint, symmetricPoint)
    newTopLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -(style.rotate ?? 0))
    newBottomRightPoint = calculateRotatedPointCoordinate(rotatedBottomRightPoint, newCenterPoint, -(style.rotate ?? 0))

    newWidth = newBottomRightPoint.x - newTopLeftPoint.x
    newHeight = newBottomRightPoint.y - newTopLeftPoint.y
  }

  if (newWidth > 0 && newHeight > 0) {
    style.width = Math.round(newWidth)
    style.height = Math.round(newHeight)
    style.left = Math.round(newTopLeftPoint.x)
    style.top = Math.round(newTopLeftPoint.y)
  }
}

/**
 * 计算左下角拖动后的样式
 */
function calculateLeftBottom(
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint } = pointInfo
  let newCenterPoint = getCenterPoint(curPosition, symmetricPoint)
  let newTopRightPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -(style.rotate ?? 0))
  let newBottomLeftPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -(style.rotate ?? 0))

  let newWidth = newTopRightPoint.x - newBottomLeftPoint.x
  let newHeight = newBottomLeftPoint.y - newTopRightPoint.y

  if (needLockProportion) {
    if (newWidth / newHeight > proportion) {
      newBottomLeftPoint.x += Math.abs(newWidth - newHeight * proportion)
      newWidth = newHeight * proportion
    } else {
      newBottomLeftPoint.y -= Math.abs(newHeight - newWidth / proportion)
      newHeight = newWidth / proportion
    }

    const rotatedBottomLeftPoint = calculateRotatedPointCoordinate(newBottomLeftPoint, newCenterPoint, style.rotate ?? 0)
    newCenterPoint = getCenterPoint(rotatedBottomLeftPoint, symmetricPoint)
    newTopRightPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -(style.rotate ?? 0))
    newBottomLeftPoint = calculateRotatedPointCoordinate(rotatedBottomLeftPoint, newCenterPoint, -(style.rotate ?? 0))

    newWidth = newTopRightPoint.x - newBottomLeftPoint.x
    newHeight = newBottomLeftPoint.y - newTopRightPoint.y
  }

  if (newWidth > 0 && newHeight > 0) {
    style.width = Math.round(newWidth)
    style.height = Math.round(newHeight)
    style.left = Math.round(newBottomLeftPoint.x)
    style.top = Math.round(newTopRightPoint.y)
  }
}

/**
 * 计算上边中点拖动后的样式
 */
function calculateTop(
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint, curPoint } = pointInfo
  const rotatedCurPosition = calculateRotatedPointCoordinate(curPosition, curPoint, -(style.rotate ?? 0))

  const rotatedTopMiddlePoint = calculateRotatedPointCoordinate(
    {
      x: curPoint.x,
      y: rotatedCurPosition.y,
    },
    curPoint,
    style.rotate ?? 0
  )

  const newHeight = Math.sqrt(
    (rotatedTopMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedTopMiddlePoint.y - symmetricPoint.y) ** 2
  )

  const newCenter = {
    x: rotatedTopMiddlePoint.x - (rotatedTopMiddlePoint.x - symmetricPoint.x) / 2,
    y: rotatedTopMiddlePoint.y + (symmetricPoint.y - rotatedTopMiddlePoint.y) / 2,
  }

  let width = style.width
  if (needLockProportion) {
    width = newHeight * proportion
  }

  style.width = width
  style.height = Math.round(newHeight)
  style.top = Math.round(newCenter.y - newHeight / 2)
  style.left = Math.round(newCenter.x - style.width / 2)
}

/**
 * 计算右边中点拖动后的样式
 */
function calculateRight(
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint, curPoint } = pointInfo
  const rotatedCurPosition = calculateRotatedPointCoordinate(curPosition, curPoint, -(style.rotate ?? 0))
  const rotatedRightMiddlePoint = calculateRotatedPointCoordinate(
    {
      x: rotatedCurPosition.x,
      y: curPoint.y,
    },
    curPoint,
    style.rotate ?? 0
  )

  const newWidth = Math.sqrt(
    (rotatedRightMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedRightMiddlePoint.y - symmetricPoint.y) ** 2
  )

  const newCenter = {
    x: rotatedRightMiddlePoint.x - (rotatedRightMiddlePoint.x - symmetricPoint.x) / 2,
    y: rotatedRightMiddlePoint.y + (symmetricPoint.y - rotatedRightMiddlePoint.y) / 2,
  }

  let height = style.height
  if (needLockProportion) {
    height = newWidth / proportion
  }

  style.height = height
  style.width = Math.round(newWidth)
  style.top = Math.round(newCenter.y - style.height / 2)
  style.left = Math.round(newCenter.x - newWidth / 2)
}

/**
 * 计算下边中点拖动后的样式
 */
function calculateBottom(
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint, curPoint } = pointInfo
  const rotatedCurPosition = calculateRotatedPointCoordinate(curPosition, curPoint, -(style.rotate ?? 0))
  const rotatedBottomMiddlePoint = calculateRotatedPointCoordinate(
    {
      x: curPoint.x,
      y: rotatedCurPosition.y,
    },
    curPoint,
    style.rotate ?? 0
  )

  const newHeight = Math.sqrt(
    (rotatedBottomMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedBottomMiddlePoint.y - symmetricPoint.y) ** 2
  )

  const newCenter = {
    x: rotatedBottomMiddlePoint.x - (rotatedBottomMiddlePoint.x - symmetricPoint.x) / 2,
    y: rotatedBottomMiddlePoint.y + (symmetricPoint.y - rotatedBottomMiddlePoint.y) / 2,
  }

  let width = style.width
  if (needLockProportion) {
    width = newHeight * proportion
  }

  style.width = width
  style.height = Math.round(newHeight)
  style.top = Math.round(newCenter.y - newHeight / 2)
  style.left = Math.round(newCenter.x - style.width / 2)
}

/**
 * 计算左边中点拖动后的样式
 */
function calculateLeft(
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  const { symmetricPoint, curPoint } = pointInfo
  const rotatedCurPosition = calculateRotatedPointCoordinate(curPosition, curPoint, -(style.rotate ?? 0))
  const rotatedLeftMiddlePoint = calculateRotatedPointCoordinate(
    {
      x: rotatedCurPosition.x,
      y: curPoint.y,
    },
    curPoint,
    style.rotate ?? 0
  )

  const newWidth = Math.sqrt(
    (rotatedLeftMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedLeftMiddlePoint.y - symmetricPoint.y) ** 2
  )

  const newCenter = {
    x: rotatedLeftMiddlePoint.x - (rotatedLeftMiddlePoint.x - symmetricPoint.x) / 2,
    y: rotatedLeftMiddlePoint.y + (symmetricPoint.y - rotatedLeftMiddlePoint.y) / 2,
  }

  let height = style.height
  if (needLockProportion) {
    height = newWidth / proportion
  }

  style.height = height
  style.width = Math.round(newWidth)
  style.top = Math.round(newCenter.y - style.height / 2)
  style.left = Math.round(newCenter.x - newWidth / 2)
}

/**
 * 控制点计算函数映射
 */
const funcs: Record<PointName, CalculateFunction> = {
  lt: calculateLeftTop,
  t: calculateTop,
  rt: calculateRightTop,
  r: calculateRight,
  rb: calculateRightBottom,
  b: calculateBottom,
  lb: calculateLeftBottom,
  l: calculateLeft,
}

/**
 * 计算组件拖动后的位置和大小
 * @param name 控制点名称
 * @param style 组件样式
 * @param curPosition 当前位置
 * @param proportion 宽高比
 * @param needLockProportion 是否锁定宽高比
 * @param pointInfo 控制点信息
 */
export default function calculateComponentPositionAndSize(
  name: PointName,
  style: ComponentStyle,
  curPosition: Point,
  proportion: number,
  needLockProportion: boolean,
  pointInfo: PointInfo
): void {
  funcs[name](style, curPosition, proportion, needLockProportion, pointInfo)
}
