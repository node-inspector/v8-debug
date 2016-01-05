#ifndef X_INJECTED_SCRIPT_HOST_
#define X_INJECTED_SCRIPT_HOST_

#include <nan.h>

namespace nodex {

  class InjectedScriptHost {
   public:
     static void Initialize(v8::Handle<v8::Object> target);
     static NAN_METHOD(Eval);
     static NAN_METHOD(EvaluateWithExceptionDetails);
     static NAN_METHOD(SetNonEnumProperty);
     static NAN_METHOD(Subtype);
     static NAN_METHOD(InternalConstructorName);
     static NAN_METHOD(FunctionDetailsWithoutScopes);
     static NAN_METHOD(CallFunction);
     static NAN_METHOD(GetInternalProperties);
   private:
     static v8::Local<v8::Object> createExceptionDetails(v8::Local<v8::Message> message);
     static v8::Local<v8::String> functionDisplayName(v8::Local<v8::Function> function);
     static const char* toCoreStringWithUndefinedOrNullCheck(v8::Local<v8::String> result);
  };

} //namespace nodex
#endif  // X_INJECTED_SCRIPT_HOST_
