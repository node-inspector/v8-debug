#include <v8-debug.h>

#include "InjectedScriptHost.h"
#include "tools.h"

using v8::Isolate;
using v8::Handle;
using v8::Local;
using v8::Value;
using v8::Boolean;
using v8::Number;
using v8::Integer;
using v8::String;
using v8::Object;
using v8::Array;
using v8::Message;
using v8::Function;
using Nan::To;
using Nan::New;
using Nan::Get;
using Nan::Set;
using Nan::ForceSet;
using Nan::SetMethod;
using Nan::EscapableHandleScope;
using Nan::Undefined;
using Nan::TryCatch;
using Nan::ThrowError;
using Nan::ThrowTypeError;
using Nan::MaybeLocal;
using Nan::EmptyString;
using Nan::Utf8String;

namespace nodex {
  void InjectedScriptHost::Initialize(Handle<Object> target) {
    Local<Object> injectedScriptHost = New<Object>();
    SetMethod(injectedScriptHost, "eval", Eval);
    SetMethod(injectedScriptHost, "evaluateWithExceptionDetails", EvaluateWithExceptionDetails);
    SetMethod(injectedScriptHost, "setNonEnumProperty", SetNonEnumProperty);
    SetMethod(injectedScriptHost, "subtype", Subtype);
    SetMethod(injectedScriptHost, "internalConstructorName", InternalConstructorName);
    SetMethod(injectedScriptHost, "functionDetailsWithoutScopes", FunctionDetailsWithoutScopes);
    SetMethod(injectedScriptHost, "callFunction", CallFunction);

    SET(target, "InjectedScriptHost", injectedScriptHost);
  }

  Handle<Object> InjectedScriptHost::createExceptionDetails(Handle<Message> message) {
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

  NAN_METHOD(InjectedScriptHost::EvaluateWithExceptionDetails) {
    if (info.Length() < 1)
      return ThrowError("One argument expected.");

    Local<Object> wrappedResult = New<Object>();
    Local<String> expression = CHK(To<String>(info[0]));
    if (expression.IsEmpty())
      return ThrowTypeError("The argument must be a string.");

    TryCatch tryCatch;
    MaybeLocal<Value> result;
    RUNSCRIPT(expression, result);

    if (tryCatch.HasCaught()) {
      SET(wrappedResult, "result", tryCatch.Exception());
      SET(wrappedResult, "exceptionDetails", createExceptionDetails(tryCatch.Message()));
    } else {
      SET(wrappedResult, "result", CHK(result));
      SET(wrappedResult, "exceptionDetails", Undefined());
    }

    RETURN(wrappedResult);
  };

  NAN_METHOD(InjectedScriptHost::SetNonEnumProperty) {
    if (info.Length() < 3)
      return ThrowError("Three arguments expected.");
    if (!info[0]->IsObject())
      return ThrowTypeError("Argument 0 must be an object.");
    if (!info[1]->IsString())
      return ThrowTypeError("Argument 1 must be a string.");

    Local<Object> object = CHK(To<Object>(info[0]));
    ForceSet(object, info[1], info[2], v8::DontEnum);

    RETURN(Undefined());
  };

  NAN_METHOD(InjectedScriptHost::Subtype) {
    if (info.Length() < 1)
      return ThrowError("One argument expected.");

    Local<Value> value = info[0];
    if (value->IsArray() || value->IsTypedArray() || value->IsArgumentsObject())
      RETURN(CHK(New("array")));

    if (value->IsDate())
      RETURN(CHK(New("date")));

    if (value->IsRegExp())
      RETURN(CHK(New("regexp")));

    if (value->IsMap() || value->IsWeakMap())
      RETURN(CHK(New("map")));

    if (value->IsSet() || value->IsWeakSet())
      RETURN(CHK(New("set")));

    if (value->IsMapIterator() || value->IsSetIterator())
      RETURN(CHK(New("iterator")));

    if (value->IsGeneratorObject())
      RETURN(CHK(New("generator")));

    if (value->IsNativeError())
      RETURN(CHK(New("error")));

    RETURN(Undefined());
  };

  Local<String> InjectedScriptHost::functionDisplayName(Handle<Function> function) {
    EscapableHandleScope scope;

    Local<String> value = CHK(To<String>(function->GetDisplayName()));
    if (value->Length())
      return scope.Escape(value);

    value = CHK(To<String>(function->GetName()));
    if (value->Length())
      return scope.Escape(value);

    value = CHK(To<String>(function->GetInferredName()));
    if (value->Length())
      return scope.Escape(value);

    return scope.Escape(EmptyString());
  };

  NAN_METHOD(InjectedScriptHost::InternalConstructorName) {
    if (info.Length() < 1)
      return ThrowError("One argument expected.");
    if (!info[0]->IsObject())
      return ThrowTypeError("The argument must be an object.");

    Local<Object> object = CHK(To<Object>(info[0]));
    Local<String> result = object->GetConstructorName();

    const char* result_type;
    if (result.IsEmpty() || result->IsNull() || result->IsUndefined())
      result_type = "";
    else
      result_type = *Utf8String(info[0]);

    if (!result.IsEmpty() && strcmp(result_type, "Object") == 0) {
      Local<String> constructorSymbol = CHK(New("constructor"));
      if (object->HasRealNamedProperty(constructorSymbol) && !object->HasRealNamedCallbackProperty(constructorSymbol)) {
        TryCatch tryCatch;
        Local<Value> constructor = object->GetRealNamedProperty(constructorSymbol);
        if (!constructor.IsEmpty() && constructor->IsFunction()) {
          Local<String> constructorName = functionDisplayName(Handle<Function>::Cast(constructor));
          if (!constructorName.IsEmpty() && !tryCatch.HasCaught())
            result = constructorName;
        }
      }
      if (strcmp(result_type, "Object") == 0 && object->IsFunction())
        result = CHK(New("Function"));
    }

    RETURN(result);
  }

  NAN_METHOD(InjectedScriptHost::FunctionDetailsWithoutScopes) {
    if (info.Length() < 1)
      return ThrowError("One argument expected.");

    if (!info[0]->IsFunction())
      return ThrowTypeError("The argument must be a function.");

    Local<Function> function = Local<Function>::Cast(info[0]);
    int32_t lineNumber = function->GetScriptLineNumber();
    int32_t columnNumber = function->GetScriptColumnNumber();

    Local<Object> location = New<Object>();
    SET(location, "lineNumber", New(lineNumber));
    SET(location, "columnNumber", New(columnNumber));
    SET(location, "scriptId", CHK(To<String>(New(function->ScriptId()))));

    Local<Object> result = New<Object>();
    SET(result, "location", location);

    Handle<String> name = functionDisplayName(function);
    SET(result, "functionName", name.IsEmpty() ? EmptyString() : name);

    SET(result, "isGenerator", New<Boolean>(function->IsGeneratorFunction()));

    RETURN(result);
  }

  NAN_METHOD(InjectedScriptHost::CallFunction) {
    if (info.Length() < 2 || info.Length() > 3)
      return ThrowError("Two or three arguments expected.");
    if (!info[0]->IsFunction())
      return ThrowTypeError("Argument 0 must be a function.");

    Handle<Function> function = Handle<Function>::Cast(info[0]);
    Handle<Value> receiver = info[1];

    TryCatch tryCatch;
    MaybeLocal<Value> result;

    if (info.Length() < 3 || info[2]->IsUndefined()) {
      result = function->Call(receiver, 0, NULL);
      MAYBE_RETHROW();
      RETURN(CHK(result));
    }

    if (!info[2]->IsArray())
      return ThrowTypeError("Argument 2 must be an array.");

    Handle<Array> arguments = Handle<Array>::Cast(info[2]);
    int argc = arguments->Length();
    Handle<Value> *argv = new Handle<Value>[argc];
    for (int i = 0; i < argc; ++i)
      argv[i] = CHK(Get(arguments, i));

    result = function->Call(receiver, argc, argv);
    delete [] argv;

    MAYBE_RETHROW();
    RETURN(CHK(result));
  };

  NAN_METHOD(InjectedScriptHost::Eval) {
    if (info.Length() < 1)
      return ThrowError("One argument expected.");

    Local<String> expression = info[0]->ToString();
    if (expression.IsEmpty())
      return ThrowTypeError("The argument must be a string.");

    TryCatch tryCatch;
    MaybeLocal<Value> result;
    RUNSCRIPT(expression, result);
    MAYBE_RETHROW();

    RETURN(CHK(result));
  };
}
