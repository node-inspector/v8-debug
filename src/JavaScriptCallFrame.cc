#include <v8-debug.h>

#include "JavaScriptCallFrame.h"
#include "tools.h"

using v8::Isolate;
using v8::Local;
using v8::Value;
using v8::Number;
using v8::Integer;
using v8::String;
using v8::Object;
using v8::Message;
using v8::Function;
using Nan::To;
using Nan::New;
using Nan::Get;
using Nan::Set;
using Nan::SetMethod;
using Nan::EscapableHandleScope;
using Nan::Undefined;
using Nan::TryCatch;
using Nan::ThrowError;
using Nan::ThrowTypeError;
using Nan::MaybeLocal;

namespace nodex {
  void JavaScriptCallFrame::Initialize(Local<Object> target) {
    Local<Object> javaScriptCallFrame = New<Object>();
    SetMethod(javaScriptCallFrame, "evaluateWithExceptionDetails", EvaluateWithExceptionDetails);
    SetMethod(javaScriptCallFrame, "restart", Restart);

    SET(target, "JavaScriptCallFrame", javaScriptCallFrame);
  }

  Local<Object> JavaScriptCallFrame::createExceptionDetails(Local<Message> message) {
    EscapableHandleScope scope;

    Local<Object> exceptionDetails = New<Object>();
    SET(exceptionDetails, "text", message->Get());

    SET(exceptionDetails, "url", message->GetScriptOrigin().ResourceName());
    SET(exceptionDetails, "scriptId", New<Integer>((int32_t)message->GetScriptOrigin().ScriptID()->Value()));
    SET(exceptionDetails, "line", New<Integer>(message->GetLineNumber()));
    SET(exceptionDetails, "column", New<Number>(message->GetStartColumn()));

    if (!message->GetStackTrace().IsEmpty())
      SET(exceptionDetails, "stackTrace", message->GetStackTrace()->AsArray());
    else
      SET(exceptionDetails, "stackTrace", Undefined());

    return scope.Escape(exceptionDetails);
  };

  NAN_METHOD(JavaScriptCallFrame::EvaluateWithExceptionDetails) {
    Local<Object> callFrame = CHK(To<Object>(CHK(Get(info.Holder(), CHK(New("proto"))))));
    Local<Function> evalFunction = Local<Function>::Cast(CHK(Get(callFrame, CHK(New("evaluate")))));

    Local<Value> expression = info[0];
    Local<Value> scopeExtension = info[1];
    v8::Local<v8::Value> argv[] = {
        expression,
        scopeExtension
    };

    Local<Object> wrappedResult = New<Object>();

    TryCatch tryCatch;
    MaybeLocal<Value> result;

    result = evalFunction->Call(callFrame, 2, argv);

    if (tryCatch.HasCaught()) {
      SET(wrappedResult, "result", tryCatch.Exception());
      SET(wrappedResult, "exceptionDetails", createExceptionDetails(tryCatch.Message()));
    } else {
      SET(wrappedResult, "result", CHK(result));
      SET(wrappedResult, "exceptionDetails", Undefined());
    }

    RETURN(wrappedResult);
  };

  NAN_METHOD(JavaScriptCallFrame::Restart) {
    Local<Object> callFrame = CHK(To<Object>(CHK(Get(info.Holder(), CHK(New("proto"))))));
    Local<Function> restartFunction = Local<Function>::Cast(CHK(Get(callFrame, CHK(New("restart")))));

    TryCatch tryCatch;
    MaybeLocal<Value> result;

    v8::Debug::SetLiveEditEnabled(info.GetIsolate(), true);
    result = restartFunction->Call(callFrame, 0, NULL);
    v8::Debug::SetLiveEditEnabled(info.GetIsolate(), false);

    MAYBE_RETHROW();
    RETURN(CHK(result));
  };
}
