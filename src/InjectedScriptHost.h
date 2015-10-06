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
    /*
    static v8::Local<v8::Value> New(const v8::CpuProfile* node);
    static Nan::Persistent<v8::Array> profiles;
    */
   private:
     static v8::Handle<v8::Object> createExceptionDetails(v8::Handle<v8::Message> message);
     static v8::Local<v8::String> functionDisplayName(v8::Handle<v8::Function> function);

    /*
    static NAN_METHOD(Delete);
    static void Initialize();
    static Nan::Persistent<v8::ObjectTemplate> profile_template_;
    static uint32_t uid_counter;
    */
  };

} //namespace nodex
#endif  // X_INJECTED_SCRIPT_HOST_
