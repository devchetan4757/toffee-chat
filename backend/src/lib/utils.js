import jwt from "jsonwebtoken";

export const generateToken = (res, payload) => {

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "90m",
  });

  // `secure: true` cookies are silently DROPPED by the browser on any
  // plain-http connection (only works over https, or on localhost —
  // which browsers treat as a secure context as a special case). If
  // this server is ever reached over http from anything other than
  // localhost (a LAN IP, a phone on the same wifi, an http-only
  // deploy), the Set-Cookie header from /login is accepted by the
  // server but never actually stored by the browser. The login
  // response body still looks successful (role/user come back fine,
  // and the socket "join" the client fires right after is NOT
  // authenticated — it just echoes whatever role string the client
  // sends), but every following request that depends on the cookie
  // (GET /auth/check, messages, gallery, etc.) then 401s with "Not
  // authenticated" because there's no cookie to send back.
  //
  // Fix: only require secure+cross-site cookies when we're actually
  // behind https, driven by an explicit env var rather than guessing
  // from NODE_ENV. Set CROSS_SITE_COOKIES=true in your env ONLY if the
  // frontend and backend are on different domains AND both are served
  // over https. Otherwise this defaults to the safe same-site setup
  // that works over plain http too (e.g. testing on a LAN IP).
  const crossSite = process.env.CROSS_SITE_COOKIES === "true";

  res.cookie("jwt", token, {
    maxAge: 90 * 60 * 1000,
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite,
  });

  return token;
};
