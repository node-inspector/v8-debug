#include "nan.h"
#include "v8-debug.h"

namespace nodex {

  class Debug {
    public:
      
      static NAN_METHOD(Call) {
        NanScope();
        
        if (args.Length() < 1) {
          return NanThrowError("Error");
        }
        
        v8::Handle<v8::Function> fn = v8::Handle<v8::Function>::Cast(args[0]);
        v8::Debug::Call(fn);
        
        NanReturnUndefined();
      };
      
      static NAN_METHOD(Signal) {
        NanScope();
        
        size_t length;
        const char* msg = NanCString(args[0], &length);
        uint16_t* command = (uint16_t*)malloc(sizeof(uint16_t) * (length + 1));
        command[length] = 0;
        for (int i = 0; i < strlen(msg); i++) {
          command[i] = msg[i];
        }
        v8::Debug::SendCommand(command, length);
        
        NanReturnUndefined();
      };
      
    private:
      Debug() {}
      ~Debug() {}
  };
  
  void Initialize(v8::Handle<v8::Object> target) {
    NanScope();
    NODE_SET_METHOD(target, "call", Debug::Call);
    NODE_SET_METHOD(target, "signal", Debug::Signal);
  }
  
  NODE_MODULE(debug, Initialize)
}