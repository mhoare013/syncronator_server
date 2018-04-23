module.exports = function (grunt) {

    // noinspection JSAnnotator
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        ts: {
            build: {
                tsconfig: "./tsconfig.json",
                fast: "never"
            }
        },
        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            }, all: {
                src: ["src/**/*.ts"]
            }
        }, watch: {
            scripts: {
                files: ["src/**/*.ts"],
                task: ["tslint:all", "ts:build"],
                options: {
                    spawn: false
                }
            }
        },
        mkdir: {
            volume: {
                options: {
                    mode: 0700,
                    create: ['deploy/volume', 'deploy/volume/logs']
                }
            }
        },
        copy: {
            resources: {
                files: [
                    {expand: true, cwd: 'src/', src: ['resources/**'], dest: 'deploy/src/'}
                ]
            }
        },
        clean: {
            dist: ["./deploy"],
            tscache: [".tscache"]
        }
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');


    grunt.registerTask("clean_build",
        ["tslint:all", "clean:dist", "ts:build", "mkdir:volume", "copy:resources", "clean:tscache"]);
};