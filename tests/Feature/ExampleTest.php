<?php

test('returns a redirect to login response', function () {
    $response = $this->get('/');

    $response->assertRedirect('/auth/login');
});