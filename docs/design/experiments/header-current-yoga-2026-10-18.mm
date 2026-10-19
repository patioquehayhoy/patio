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

struct Result{float groupW,groupX,buttonW,textW,textH,toolbarH,titleX,titleW;bool separate;};
static YGSize singleLine(YGNodeConstRef node,float width,YGMeasureMode wm,float,YGMeasureMode){auto*d=static_cast<TextData*>(YGNodeGetContext(node));auto size=[d->text sizeWithAttributes:@{NSFontAttributeName:d->font}];float w=wm==YGMeasureModeUndefined?size.width:std::min((float)size.width,width);return{w,(float)d->font.pointSize/15*20};}
static Result header(float screen,float scale,NSString*action,bool add,NSString*title){
 auto c=YGConfigNew();YGConfigSetUseWebDefaults(c,false);YGConfigSetErrata(c,YGErrataAll);YGConfigSetPointScaleFactor(c,0);
 auto root=YGNodeNewWithConfig(c);YGNodeStyleSetWidth(root,screen-32);YGNodeStyleSetMinHeight(root,44);YGNodeStyleSetFlexDirection(root,YGFlexDirectionRow);YGNodeStyleSetAlignItems(root,YGAlignCenter);YGNodeStyleSetJustifyContent(root,YGJustifySpaceBetween);YGNodeStyleSetFlexWrap(root,YGWrapWrap);YGNodeStyleSetGap(root,YGGutterColumn,8);YGNodeStyleSetGap(root,YGGutterRow,4);
 auto leading=YGNodeNewWithConfig(c);YGNodeStyleSetMinWidth(leading,44);YGNodeStyleSetMinHeight(leading,44);YGNodeStyleSetMaxWidthPercent(leading,100);YGNodeStyleSetFlexShrink(leading,0);YGNodeInsertChild(root,leading,0);
 auto group=YGNodeNewWithConfig(c);YGNodeStyleSetMinWidth(group,44);YGNodeStyleSetMinHeight(group,44);YGNodeStyleSetMaxWidthPercent(group,100);YGNodeStyleSetFlexDirection(group,YGFlexDirectionRow);YGNodeStyleSetFlexWrap(group,YGWrapWrap);YGNodeStyleSetAlignItems(group,YGAlignCenter);YGNodeStyleSetJustifyContent(group,YGJustifyFlexEnd);YGNodeStyleSetGap(group,YGGutterAll,4);YGNodeStyleSetFlexShrink(group,0);YGNodeStyleSetMarginAuto(group,YGEdgeLeft);
 auto btn=YGNodeNewWithConfig(c);YGNodeStyleSetMinWidth(btn,44);YGNodeStyleSetMinHeight(btn,44);YGNodeStyleSetPadding(btn,YGEdgeHorizontal,8);YGNodeStyleSetFlexShrink(btn,0);YGNodeStyleSetAlignItems(btn,YGAlignCenter);YGNodeStyleSetJustifyContent(btn,YGJustifyCenter);
 auto text=YGNodeNewWithConfig(c);TextData td{action,[NSFont systemFontOfSize:15*scale weight:NSFontWeightSemibold]};YGNodeSetContext(text,&td);YGNodeSetMeasureFunc(text,singleLine);YGNodeInsertChild(btn,text,0);YGNodeInsertChild(group,btn,0);
 if(add){auto a=YGNodeNewWithConfig(c);YGNodeStyleSetWidth(a,44);YGNodeStyleSetHeight(a,44);YGNodeInsertChild(group,a,1);}YGNodeInsertChild(root,group,1);YGNodeCalculateLayout(root,YGUndefined,YGUndefined,YGDirectionLTR);
 float side=std::max(44.f,YGNodeLayoutGetWidth(group));float titleIntrinsic=[title sizeWithAttributes:@{NSFontAttributeName:[NSFont systemFontOfSize:17*scale weight:NSFontWeightBold]}].width;bool separate=scale>1.4f||screen-32-side*2<titleIntrinsic+16;
 Result r{YGNodeLayoutGetWidth(group),YGNodeLayoutGetLeft(group),YGNodeLayoutGetWidth(btn),YGNodeLayoutGetWidth(text),YGNodeLayoutGetHeight(text),YGNodeLayoutGetHeight(root),side,std::max(0.f,screen-32-side*2),separate};YGNodeFreeRecursive(root);YGConfigFree(c);return r;
}
int main(){@autoreleasepool{int failures=0,count=0;for(float screen:{320.f,393.f})for(float scale:{1.f,1.6f,2.f})for(NSString*action:@[@"Listo",@"Organizar"]){bool add=[action isEqualToString:@"Organizar"];auto r=header(screen,scale,action,add,add?@"Listas":@"Organizar listas");float natural=[action sizeWithAttributes:@{NSFontAttributeName:[NSFont systemFontOfSize:15*scale weight:NSFontWeightSemibold]}].width;bool ok=r.textW>=natural-.01f&&r.groupX+r.groupW<=screen-32+.01f&&r.groupX>=44+8-.01f&&r.toolbarH>=r.textH;count++;if(!ok)failures++;std::printf("%.0fpt %.0f%% %s group=%.2f x=%.2f text=%.2fx%.2f toolbarH=%.2f title=%s %s\n",screen,scale*100,[action UTF8String],r.groupW,r.groupX,r.textW,r.textH,r.toolbarH,r.separate?"second-row":"centered",ok?"PASS":"FAIL");}std::printf("CHECKED %d; FAILURES %d\n",count,failures);return failures?1:0;}}
