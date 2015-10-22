#include <v8-debug.h>
#include <nan.h>

#include "tools.h"
#if (NODE_NEXT)
#include "InjectedScriptHost.h"
#endif

using v8::Isolate;
using v8::Local;
using v8::Value;
using v8::String;
using v8::Object;
using v8::Context;
using v8::Function;
using Nan::To;
using Nan::New;
using Nan::Set;
using Nan::SetMethod;
using Nan::HandleScope;
using Nan::Undefined;
using Nan::TryCatch;
using Nan::ThrowError;
using Nan::RunScript;
using Nan::MaybeLocal;

namespace nodex {

  class Debug {
    public:

      static NAN_METHOD(Call) {
        if (info.Length() < 1) {
          return ThrowError("Error");
        }

        Local<Function> fn = Local<Function>::Cast(info[0]);
        v8::Debug::Call(fn);

        RETURN(Undefined());
      };

      static NAN_METHOD(SendCommand) {
        String::Value command(info[0]);
#if (NODE_MODULE_VERSION > 11)
        Isolate* debug_isolate = v8::Debug::GetDebugContext()->GetIsolate();
        v8::HandleScope debug_scope(debug_isolate);
        v8::Debug::SendCommand(debug_isolate, *command, command.length());
#else
        v8::Debug::SendCommand(*command, command.length());
#endif
        RETURN(Undefined());
      };

      static NAN_METHOD(RunScript) {
        Local<String> expression = CHK(To<String>(info[0]));

        if (expression.IsEmpty())
          RETURN(Undefined());

        Local<Context> debug_context = v8::Debug::GetDebugContext();
#if (NODE_MODULE_VERSION > 45)
        if (debug_context.IsEmpty()) {
          // Force-load the debug context.
          v8::Debug::GetMirror(info.GetIsolate()->GetCurrentContext(), info[0]);
          debug_context = v8::Debug::GetDebugContext();
        }
#endif

        Context::Scope context_scope(debug_context);

        TryCatch tryCatch;
        MaybeLocal<Value> result;
        RUNSCRIPT(expression, result);
        MAYBE_RETHROW();
        RETURN(CHK(result));
      };

      static NAN_METHOD(AllowNatives) {
        const char allow_natives_syntax[] = "--allow_natives_syntax";
        v8::V8::SetFlagsFromString(allow_natives_syntax, sizeof(allow_natives_syntax) - 1);

        RETURN(Undefined());
      }

    private:
      Debug() {}
      ~Debug() {}
  };

  NAN_MODULE_INIT(Initialize) {
#if (NODE_NEXT)
    InjectedScriptHost::Initialize(target);
#endif

    SetMethod(target, "call", Debug::Call);
    SetMethod(target, "sendCommand", Debug::SendCommand);
    SetMethod(target, "runScript", Debug::RunScript);
    SetMethod(target, "allowNatives", Debug::AllowNatives);
  }

  NODE_MODULE(debug, Initialize)
}
