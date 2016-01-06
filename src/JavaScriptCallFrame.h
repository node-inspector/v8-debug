#ifndef X_JAVASCRIPT_CALL_FRAME_
#define X_JAVASCRIPT_CALL_FRAME_

#include <nan.h>

namespace nodex {

  class JavaScriptCallFrame {
   public:
     static void Initialize(v8::Local<v8::Object> target);
     static NAN_METHOD(EvaluateWithExceptionDetails);
     static NAN_METHOD(Restart);
   private:
     static v8::Local<v8::Object> createExceptionDetails(v8::Local<v8::Message> message);
  };

} //namespace nodex
#endif  // X_JAVASCRIPT_CALL_FRAME_
