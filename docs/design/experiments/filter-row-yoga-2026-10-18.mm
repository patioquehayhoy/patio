#import <AppKit/AppKit.h>
#include <yoga/Yoga.h>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <vector>
struct TextData { NSString *text; NSFont *font; };
static YGSize measure(YGNodeConstRef node,float width,YGMeasureMode widthMode,float height,YGMeasureMode heightMode) {
  auto *d=static_cast<TextData*>(YGNodeGetContext(node));
  NSDictionary *attrs=@{NSFontAttributeName:d->font};
  NSSize intrinsic=[d->text sizeWithAttributes:attrs];
  float available=widthMode==YGMeasureModeUndefined ? intrinsic.width : width;
  NSRect box=[d->text boundingRectWithSize:NSMakeSize(available,CGFLOAT_MAX) options:NSStringDrawingUsesLineFragmentOrigin|NSStringDrawingUsesFontLeading attributes:attrs];
  float measuredWidth=widthMode==YGMeasureModeExactly ? width : std::min((float)intrinsic.width,available);
  return {measuredWidth,(float)std::ceil(box.size.height)};
}
struct Result {float x,labelWidth,valueWidth,height;};
static Result probe(float screenWidth,float fontScale,NSString* label,NSString* value,bool fixed) {
  auto config=YGConfigNew();
  YGConfigSetUseWebDefaults(config,false); YGConfigSetPointScaleFactor(config,0);
  auto row=YGNodeNewWithConfig(config); YGNodeStyleSetWidth(row,screenWidth-32); YGNodeStyleSetMinHeight(row,52); YGNodeStyleSetPadding(row,YGEdgeHorizontal,16); YGNodeStyleSetPadding(row,YGEdgeVertical,6); YGNodeStyleSetGap(row,YGGutterColumn,12); YGNodeStyleSetFlexDirection(row,YGFlexDirectionRow); YGNodeStyleSetAlignItems(row,YGAlignCenter);
  auto icon=YGNodeNewWithConfig(config); YGNodeStyleSetWidth(icon,22); YGNodeStyleSetHeight(icon,20); YGNodeStyleSetFlexShrink(icon,0);
  auto lab=YGNodeNewWithConfig(config); auto val=YGNodeNewWithConfig(config);
  TextData ld{label,[NSFont systemFontOfSize:15*fontScale weight:NSFontWeightMedium]}; TextData vd{value,[NSFont systemFontOfSize:14*fontScale weight:NSFontWeightRegular]};
  YGNodeSetContext(lab,&ld);YGNodeSetMeasureFunc(lab,measure);YGNodeSetContext(val,&vd);YGNodeSetMeasureFunc(val,measure);
  if(fixed) { YGNodeStyleSetFlex(lab,1);YGNodeStyleSetMinWidth(lab,0);YGNodeStyleSetFlexShrink(val,1); }
  else { YGNodeStyleSetFlexShrink(lab,1);YGNodeStyleSetFlex(val,1); }
  YGNodeStyleSetMinWidth(val,0);YGNodeStyleSetMaxWidthPercent(val,45);
  auto chevron=YGNodeNewWithConfig(config);YGNodeStyleSetWidth(chevron,16);YGNodeStyleSetHeight(chevron,16);YGNodeStyleSetFlexShrink(chevron,0);
  YGNodeInsertChild(row,icon,0);YGNodeInsertChild(row,lab,1);YGNodeInsertChild(row,val,2);YGNodeInsertChild(row,chevron,3);
  YGNodeCalculateLayout(row,YGUndefined,YGUndefined,YGDirectionLTR);
  Result result{16+YGNodeLayoutGetLeft(chevron),YGNodeLayoutGetWidth(lab),YGNodeLayoutGetWidth(val),YGNodeLayoutGetHeight(row)};
  YGNodeFreeRecursive(row);YGConfigFree(config);return result;
}
int main() { @autoreleasepool {
  int checked=0, failures=0;
  std::printf("screen scale label value oldX newX expectedX\n");
  for(float screen:{320.f,393.f}) for(float scale:{1.f,1.6f}) for(NSString* label:@[@"Tipo de\u00a0lugar",@"Pago"]) for(NSString* value:@[@"Todos",@"Cualquiera",@"Cafetería · Comida mexicana · Restaurante · Tarjeta · Transferencia"]) {
    auto before=probe(screen,scale,label,value,false),after=probe(screen,scale,label,value,true);
    float expected=screen-48;
    bool pass=std::fabs(after.x-expected)<0.01f;checked++;if(!pass)failures++;
    std::printf("%.0f %.0f%% %s %s %.2f %.2f %.2f %s\n",screen,scale*100,[label UTF8String],[value length]>15?"largo":[value UTF8String],before.x,after.x,expected,pass?"PASS":"FAIL");
  }
  std::printf("CHECKED %d; FAILURES %d\n",checked,failures);return failures?1:0;
} }
