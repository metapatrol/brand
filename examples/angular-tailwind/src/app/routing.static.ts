import { RouterFeatures, withComponentInputBinding, withHashLocation } from '@angular/router';

/**
 * The `static` build (the shell preview on the brand site): a bucket cannot
 * answer unknown paths with index.html, so routes live after the #.
 */
export const routingFeatures: RouterFeatures[] = [withComponentInputBinding(), withHashLocation()];
