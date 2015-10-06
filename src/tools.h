#ifndef X_DEBUG_TOOLS_
#define X_DEBUG_TOOLS_

#define CHK(VALUE)                                                            \
  VALUE.ToLocalChecked()

#define RETURN(VALUE) {                                                       \
  info.GetReturnValue().Set(VALUE);                                           \
  return;                                                                     \
}

#define SET(TARGET, NAME, VALUE)                                              \
  Nan::Set(TARGET, CHK(Nan::New(NAME)), VALUE)

#define RUNSCRIPT(EXPRESSION, RESULT) while (true) {                          \
    Nan::MaybeLocal<Nan::BoundScript> script = Nan::CompileScript(EXPRESSION);\
    if (tryCatch.HasCaught()) break;                                     \
    RESULT = Nan::RunScript(CHK(script));                                     \
    break;                                                                    \
  }

#define MAYBE_RETHROW()                                                       \
  if (tryCatch.HasCaught()) {                                            \
    tryCatch.ReThrow();                                                  \
    return;                                                                   \
  }

#endif  // X_DEBUG_TOOLS_
