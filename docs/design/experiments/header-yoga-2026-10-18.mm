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

struct Result {float groupWidth,buttonWidth,textWidth,textHeight,rootHeight;};
static Result header(float screenWidth,float scale,NSString *label,bool plus,bool fixed,float sideWidth=44) {
 auto config=YGConfigNew();YGConfigSetUseWebDefaults(config,false);YGConfigSetErrata(config,YGErrataAll);YGConfigSetPointScaleFactor(config,0);
 auto root=YGNodeNewWithConfig(config);YGNodeStyleSetWidth(root,screenWidth-32);YGNodeStyleSetMinHeight(root,44);YGNodeStyleSetFlexDirection(root,YGFlexDirectionRow);YGNodeStyleSetAlignItems(root,YGAlignCenter);YGNodeStyleSetJustifyContent(root,YGJustifySpaceBetween);
 auto leading=YGNodeNewWithConfig(config);YGNodeStyleSetWidth(leading,44);YGNodeStyleSetHeight(leading,44);YGNodeInsertChild(root,leading,0);
 auto title=YGNodeNewWithConfig(config);YGNodeStyleSetFlex(title,1);YGNodeInsertChild(root,title,1);
 auto wrapper=YGNodeNewWithConfig(config);YGNodeStyleSetAlignItems(wrapper,YGAlignFlexEnd);if(!fixed)YGNodeStyleSetWidth(wrapper,sideWidth);else YGNodeStyleSetFlexShrink(wrapper,0);
 auto group=YGNodeNewWithConfig(config);YGNodeStyleSetFlexDirection(group,YGFlexDirectionRow);YGNodeStyleSetAlignItems(group,YGAlignCenter);YGNodeStyleSetGap(group,YGGutterColumn,4);if(fixed)YGNodeStyleSetFlexShrink(group,0);
 auto button=YGNodeNewWithConfig(config);YGNodeStyleSetWidthAuto(button);YGNodeStyleSetHeight(button,44);YGNodeStyleSetAlignItems(button,YGAlignCenter);YGNodeStyleSetJustifyContent(button,YGJustifyCenter);YGNodeStyleSetPadding(button,YGEdgeHorizontal,8);if(fixed)YGNodeStyleSetFlexShrink(button,0);
 auto text=YGNodeNewWithConfig(config);TextData td{label,[NSFont systemFontOfSize:15*scale weight:NSFontWeightSemibold]};YGNodeSetContext(text,&td);YGNodeSetMeasureFunc(text,measure);YGNodeInsertChild(button,text,0);YGNodeInsertChild(group,button,0);
 if(plus){auto add=YGNodeNewWithConfig(config);YGNodeStyleSetWidth(add,44);YGNodeStyleSetHeight(add,44);YGNodeInsertChild(group,add,1);}
 YGNodeInsertChild(wrapper,group,0);YGNodeInsertChild(root,wrapper,2);YGNodeCalculateLayout(root,YGUndefined,YGUndefined,YGDirectionLTR);
 Result r{YGNodeLayoutGetWidth(group),YGNodeLayoutGetWidth(button),YGNodeLayoutGetWidth(text),YGNodeLayoutGetHeight(text),YGNodeLayoutGetHeight(root)};YGNodeFreeRecursive(root);YGConfigFree(config);return r;
}
int main(){@autoreleasepool{for(float screen:{320.f,393.f})for(float scale:{1.f,1.6f})for(NSString* label:@[@"Listo",@"Organizar"]){bool plus=[label isEqualToString:@"Organizar"];auto old=header(screen,scale,label,plus,false),again=header(screen,scale,label,plus,false,old.groupWidth),fixed=header(screen,scale,label,plus,true);std::printf("screen%.0f scale%.0f%% %s | oldgroup%.2f text%.2fx%.2f -> loopgroup%.2f text%.2fx%.2f | naturalgroup%.2f text%.2fx%.2f\n",screen,scale*100,[label UTF8String],old.groupWidth,old.textWidth,old.textHeight,again.groupWidth,again.textWidth,again.textHeight,fixed.groupWidth,fixed.textWidth,fixed.textHeight);}return 0;}}
